import asyncio
import threading
from typing import Any
from datetime import datetime
import os
import time

class TrainingManager:
    _instance = None
    _instance_lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._is_training = False
        self._train_id: str | None = None
        self._model: Any = None
        self._model_state_path: str | None = None
        self._input_shape: list | None = None
        self._num_classes: int = 10
        self._status = {
            "isTraining": False,
            "currentEpoch": 0,
            "totalEpochs": 0,
            "currentStep": 0,
            "totalSteps": 0,
            "loss": 0.0,
            "accuracy": 0.0,
            "logs": [],
        }
        self._lock = threading.Lock()
        self._training_thread = None
        self._stop_event = threading.Event()

    def _build_model_from_nodes(self, nodes: list):
        """根据前端传来的节点构建 PyTorch 模型"""
        import torch
        import torch.nn as nn

        class DynamicModel(nn.Module):
            def __init__(self, layers_list):
                super(DynamicModel, self).__init__()
                self.layers = nn.ModuleList(layers_list)

            def forward(self, x):
                for layer in self.layers:
                    x = layer(x)
                return x

        layers_list = []
        for node in nodes:
            node_type = node.get("data", {}).get("type", "")
            params = node.get("data", {}).get("params", {})
            layer = self._create_layer(node_type, params)
            if layer is not None:
                layers_list.append(layer)

        if not layers_list:
            layers_list = [nn.Flatten(), nn.Linear(784, 10)]

        model = DynamicModel(layers_list)
        return model

    def _create_layer(self, node_type: str, params: dict):
        """根据节点类型创建对应的 PyTorch 层"""
        import torch.nn as nn

        if node_type == "linear":
            return nn.Linear(
                in_features=params.get("in_features", 128),
                out_features=params.get("out_features", 64),
                bias=params.get("bias", True),
            )
        elif node_type == "conv2d":
            return nn.Conv2d(
                in_channels=params.get("in_channels", 3),
                out_channels=params.get("out_channels", 64),
                kernel_size=params.get("kernel_size", 3),
                stride=params.get("stride", 1),
                padding=params.get("padding", 1),
            )
        elif node_type == "relu":
            return nn.ReLU()
        elif node_type == "leaky_relu":
            return nn.LeakyReLU(negative_slope=params.get("negative_slope", 0.01))
        elif node_type == "dropout":
            return nn.Dropout(p=params.get("p", 0.5))
        elif node_type == "batch_norm":
            num_features = params.get("num_features", 64)
            return nn.BatchNorm2d(num_features)
        elif node_type == "batch_norm1d":
            num_features = params.get("num_features", 64)
            return nn.BatchNorm1d(num_features)
        elif node_type == "flatten":
            return nn.Flatten()
        elif node_type == "max_pool2d":
            return nn.MaxPool2d(
                kernel_size=params.get("kernel_size", 2),
                stride=params.get("stride", 2),
            )
        elif node_type == "avg_pool2d":
            return nn.AvgPool2d(
                kernel_size=params.get("kernel_size", 2),
                stride=params.get("stride", 2),
            )
        elif node_type == "softmax":
            dim = params.get("dim", 1)
            return nn.Softmax(dim=dim)
        elif node_type == "sigmoid":
            return nn.Sigmoid()
        elif node_type == "tanh":
            return nn.Tanh()
        elif node_type == "block":
            block_data = params.get("blockData", {})
            sub_layers = []
            for sub_node in block_data.get("nodes", []):
                sub_type = sub_node.get("type", "")
                sub_params = sub_node.get("params", {})
                sub_layer = self._create_layer(sub_type, sub_params)
                if sub_layer is not None:
                    sub_layers.append(sub_layer)
            if sub_layers:
                return nn.Sequential(*sub_layers)
            return None
        else:
            print(f"未支持的层类型: {node_type}")
            return None

    def _get_loss_function(self, loss_name: str):
        import torch.nn as nn
        losses = {
            "cross_entropy": nn.CrossEntropyLoss(),
            "mse": nn.MSELoss(),
            "mae": nn.L1Loss(),
            "smooth_l1": nn.SmoothL1Loss(),
        }
        return losses.get(loss_name, nn.CrossEntropyLoss())

    def _get_optimizer(self, model, opt_name: str, lr: float, weight_decay: float):
        import torch.optim as optim
        opts = {
            "adam": lambda: optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay),
            "sgd": lambda: optim.SGD(model.parameters(), lr=lr, momentum=0.9, weight_decay=weight_decay),
            "rmsprop": lambda: optim.RMSprop(model.parameters(), lr=lr, weight_decay=weight_decay),
            "adamw": lambda: optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay),
        }
        return opts.get(opt_name, opts["adam"])()

    def _get_scheduler(self, optimizer, scheduler_name: str, epochs: int, steps_per_epoch: int):
        import torch.optim.lr_scheduler as lr_scheduler
        if scheduler_name == "step_lr":
            return lr_scheduler.StepLR(optimizer, step_size=max(1, epochs // 3), gamma=0.1)
        elif scheduler_name == "cosine":
            return lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs * steps_per_epoch)
        elif scheduler_name == "plateau":
            return lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", patience=3)
        elif scheduler_name == "one_cycle":
            return lr_scheduler.OneCycleLR(
                optimizer,
                max_lr=optimizer.defaults["lr"] * 10,
                total_steps=epochs * steps_per_epoch,
            )
        return None

    async def start_training(self, graph_nodes: list, config: dict) -> str:
        with self._lock:
            if self._is_training:
                raise Exception("训练已在运行中")

            train_id = f"train_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            self._train_id = train_id
            self._is_training = True
            self._stop_event.clear()
            self._model = None
            self._model_state_path = None

            epochs = config.get("epochs", 10)
            self._status.update({
                "isTraining": True,
                "currentEpoch": 0,
                "totalEpochs": epochs,
                "currentStep": 0,
                "totalSteps": 100 * epochs,
                "loss": 0.0,
                "accuracy": 0.0,
                "logs": [],
            })

        # 使用线程运行训练，避免阻塞事件循环
        self._training_thread = threading.Thread(
            target=self._run_training_sync,
            args=(graph_nodes, config),
            daemon=True
        )
        self._training_thread.start()
        return train_id

    def _run_training_sync(self, nodes: list, config: dict):
        """同步训练函数，在线程中运行"""
        import torch
        import torch.nn as nn

        try:
            total_epochs = config.get("epochs", 10)
            dataset_type = config.get("dataset_type", "builtin")
            dataset_name = config.get("dataset", "MNIST")
            dataset_config = config.get("dataset_config")
            batch_size = config.get("batch_size", 32)
            learning_rate = config.get("learning_rate", 0.001)
            weight_decay = config.get("weight_decay", 0.0001)
            optimizer_name = config.get("optimizer", "adam").lower()
            loss_function_name = config.get("loss_function", "cross_entropy")
            lr_scheduler_name = config.get("lr_scheduler")
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

            self._add_log(0, 0, "info", f"使用设备: {device}", total_epochs)

            # 获取数据集输入形状
            from .dataset import DatasetManager
            dataset_info = DatasetManager.get_dataset_info(
                name=dataset_name,
                dataset_type=dataset_type,
                dataset_config=dataset_config,
            )
            dataset_input_shape = dataset_info.get("input_shape", [1, 28, 28])
            dataset_num_classes = dataset_info.get("num_classes", 10)

            # 获取模型期望的输入形状
            model_input_shape = self._infer_model_input_shape(nodes)

            # 检查模型输入形状与数据集形状是否匹配
            if model_input_shape is not None:
                mismatch = []
                if len(model_input_shape) >= 3 and len(dataset_input_shape) >= 3:
                    if model_input_shape[0] != dataset_input_shape[0]:
                        mismatch.append(f"通道数: 模型期望 {model_input_shape[0]}, 数据集是 {dataset_input_shape[0]}")
                    if model_input_shape[1] is not None and model_input_shape[1] != dataset_input_shape[1]:
                        mismatch.append(f"高度: 模型期望 {model_input_shape[1]}, 数据集是 {dataset_input_shape[1]}")
                    if model_input_shape[2] is not None and model_input_shape[2] != dataset_input_shape[2]:
                        mismatch.append(f"宽度: 模型期望 {model_input_shape[2]}, 数据集是 {dataset_input_shape[2]}")
                if mismatch:
                    error_msg = (
                        f"模型输入形状与数据集不匹配:\n"
                        + "\n".join(mismatch)
                        + f"\n\n数据集 '{dataset_name}' 的输入形状: {dataset_input_shape}"
                        + f"\n请调整第一个层的输入参数以匹配数据集"
                    )
                    raise ValueError(error_msg)

            # 检查输出类别数是否匹配
            model_num_classes = self._infer_model_output_classes(nodes)
            if model_num_classes is not None and dataset_num_classes is not None and model_num_classes != dataset_num_classes:
                error_msg = (
                    f"模型输出类别数与数据集不匹配:\n"
                    f"模型输出: {model_num_classes} 类\n"
                    f"数据集 '{dataset_name}': {dataset_num_classes} 类\n"
                    f"\n请调整最后一层 Linear 的 out_features 为 {dataset_num_classes}"
                )
                raise ValueError(error_msg)

            # 构建模型
            model = self._build_model_from_nodes(nodes)
            model = model.to(device)
            self._model = model
            self._input_shape = dataset_input_shape
            self._num_classes = dataset_num_classes

            param_count = sum(p.numel() for p in model.parameters())
            model_info = f"模型构建完成，参数数量: {param_count}"
            print(model_info)
            self._add_log(0, 0, "info", model_info, total_epochs)

            # 测试前向传播
            try:
                test_input = torch.randn(2, *dataset_input_shape).to(device)
                test_output = model(test_input)
                test_info = f"前向传播测试通过: 输入 {tuple(test_input.shape)} -> 输出 {tuple(test_output.shape)}"
                print(test_info)
                self._add_log(0, 0, "info", test_info, total_epochs)
            except Exception as e:
                raise Exception(f"模型前向传播测试失败: {str(e)}。请检查模型结构是否正确，例如是否缺少 Flatten 层")

            # 加载数据集
            train_loader, val_loader = DatasetManager.load_dataset(
                name=dataset_name,
                batch_size=batch_size,
                dataset_type=dataset_type,
                dataset_config=dataset_config,
            )

            dataset_info_msg = f"数据集加载成功: {dataset_name if dataset_type == 'builtin' else dataset_type}"
            print(dataset_info_msg)
            self._add_log(0, 0, "info", dataset_info_msg, total_epochs)

            # 损失函数、优化器、调度器
            criterion = self._get_loss_function(loss_function_name)
            optimizer = self._get_optimizer(model, optimizer_name, learning_rate, weight_decay)

            total_steps = len(train_loader) if hasattr(train_loader, '__len__') else 100
            scheduler = None
            if lr_scheduler_name and lr_scheduler_name != "none":
                scheduler = self._get_scheduler(optimizer, lr_scheduler_name, total_epochs, total_steps)

            self._add_log(0, 0, "info", f"开始训练: {total_epochs} epochs, {total_steps} steps/epoch", total_epochs)

            # 训练循环
            self._add_log(0, 0, "info", f"进入训练循环: {total_epochs} epochs", total_epochs)
            start_time = time.time()

            for epoch in range(1, total_epochs + 1):
                if self._stop_event.is_set():
                    self._add_log(epoch, 0, "info", "训练被用户停止", total_epochs)
                    break

                model.train()
                running_loss = 0.0
                correct = 0
                total = 0

                with self._lock:
                    self._status["currentEpoch"] = epoch

                epoch_start = time.time()

                for step, (inputs, labels) in enumerate(train_loader, 1):
                    if self._stop_event.is_set():
                        break

                    inputs, labels = inputs.to(device), labels.to(device)

                    optimizer.zero_grad()
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()

                    if scheduler is not None and lr_scheduler_name == "one_cycle":
                        scheduler.step()

                    running_loss += loss.item()
                    _, predicted = outputs.max(1)
                    total += labels.size(0)
                    correct += predicted.eq(labels).sum().item()

                    # 每步都更新状态（实时显示）
                    avg_loss = running_loss / step
                    accuracy = correct / total if total > 0 else 0

                    with self._lock:
                        self._status["currentStep"] = step
                        self._status["totalSteps"] = total_steps
                        self._status["loss"] = round(avg_loss, 4)
                        self._status["accuracy"] = round(accuracy, 4)

                    # 每10步记录一次日志
                    if step % 10 == 0 or step == total_steps:
                        current_lr = optimizer.param_groups[0]["lr"]
                        log_msg = f"Epoch {epoch}/{total_epochs} Step {step}/{total_steps} - loss: {avg_loss:.4f}, acc: {accuracy:.4f}, lr: {current_lr:.6f}"
                        self._add_log(epoch, step, "info", log_msg, total_epochs, loss=avg_loss, accuracy=accuracy, learning_rate=current_lr)

                    # 每步让出时间片，避免阻塞
                    if step % 5 == 0:
                        time.sleep(0.001)

                epoch_time = time.time() - epoch_start
                self._add_log(epoch, total_steps, "info", f"Epoch {epoch}/{total_epochs} 完成，耗时: {epoch_time:.2f}s", total_epochs)

                if scheduler is not None and lr_scheduler_name != "one_cycle":
                    if lr_scheduler_name == "plateau":
                        scheduler.step(running_loss / total_steps)
                    else:
                        scheduler.step()

                # Epoch 结束验证
                if val_loader is not None:
                    model.eval()
                    val_correct = 0
                    val_total = 0
                    val_loss = 0.0
                    with torch.no_grad():
                        for val_inputs, val_labels in val_loader:
                            val_inputs, val_labels = val_inputs.to(device), val_labels.to(device)
                            val_outputs = model(val_inputs)
                            val_loss += criterion(val_outputs, val_labels).item()
                            _, val_predicted = val_outputs.max(1)
                            val_total += val_labels.size(0)
                            val_correct += val_predicted.eq(val_labels).sum().item()

                    val_acc = val_correct / val_total if val_total > 0 else 0
                    val_loss_avg = val_loss / len(val_loader) if len(val_loader) > 0 else 0

                    val_msg = f"Epoch {epoch}/{total_epochs} - val_loss: {val_loss_avg:.4f}, val_acc: {val_acc:.4f}"
                    self._add_log(epoch, total_steps, "info", val_msg, total_epochs)

                epoch_msg = f"Epoch {epoch}/{total_epochs} 完成"
                print(epoch_msg)
                self._add_log(epoch, total_steps, "info", epoch_msg, total_epochs)

            # 保存模型到 nn_UI/checkpoints/
            from ..config import settings
            os.makedirs(settings.CHECKPOINTS_DIR, exist_ok=True)
            self._model_state_path = os.path.join(settings.CHECKPOINTS_DIR, f"{self._train_id}.pt")
            torch.save({
                "model_state_dict": model.state_dict(),
                "config": config,
                "train_id": self._train_id,
                "timestamp": datetime.now().isoformat(),
            }, self._model_state_path)

            total_time = time.time() - start_time
            save_msg = f"模型已保存: {self._model_state_path}"
            print(save_msg)
            self._add_log(total_epochs, total_steps, "info", save_msg, total_epochs)
            self._add_log(total_epochs, total_steps, "info", f"训练总耗时: {total_time:.2f}s", total_epochs)

        except Exception as e:
            print(f"Training error: {e}")
            import traceback
            traceback.print_exc()
            error_msg = f"训练错误: {str(e)}"
            self._add_log(0, 0, "error", error_msg, total_epochs if 'total_epochs' in locals() else 0)
        finally:
            with self._lock:
                self._is_training = False
                self._status["isTraining"] = False

    def _add_log(self, epoch: int, step: int, level: str, message: str, total_epochs: int, loss: float = None, accuracy: float = None, learning_rate: float = None):
        """线程安全的添加日志"""
        log_entry = {
            "epoch": epoch,
            "step": step,
            "level": level,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "totalEpochs": total_epochs,
            "loss": loss,
            "accuracy": accuracy,
            "learningRate": learning_rate,
        }
        with self._lock:
            self._status["logs"].append(log_entry)
            if len(self._status["logs"]) > 1000:
                self._status["logs"] = self._status["logs"][-500:]

    def stop_training(self):
        """停止训练"""
        self._stop_event.set()
        with self._lock:
            self._is_training = False
            self._status["isTraining"] = False

    def get_status(self) -> dict:
        """获取训练状态"""
        with self._lock:
            # 返回关键状态的副本，避免复制大量日志
            return {
                "isTraining": self._status["isTraining"],
                "currentEpoch": self._status["currentEpoch"],
                "totalEpochs": self._status["totalEpochs"],
                "currentStep": self._status["currentStep"],
                "totalSteps": self._status["totalSteps"],
                "loss": self._status["loss"],
                "accuracy": self._status["accuracy"],
                "logs": self._status["logs"][-50:],  # 只返回最近50条日志
            }

    def is_training(self) -> bool:
        """检查是否正在训练"""
        with self._lock:
            return self._is_training

    def _infer_model_input_shape(self, nodes: list) -> list | None:
        """从第一个节点推断模型期望的输入形状"""
        if not nodes:
            return None
        first_node = nodes[0]
        node_type = first_node.get("data", {}).get("type", "")
        params = first_node.get("data", {}).get("params", {})

        if node_type == "conv2d":
            in_ch = params.get("in_channels", 3)
            return [in_ch, None, None]
        elif node_type == "linear":
            in_features = params.get("in_features", None)
            if in_features:
                import math
                size = int(math.sqrt(in_features))
                if size * size == in_features:
                    return [1, size, size]
                size3 = int(math.sqrt(in_features / 3))
                if size3 * size3 * 3 == in_features:
                    return [3, size3, size3]
            return None
        elif node_type == "flatten":
            return None
        return None

    def _infer_model_output_classes(self, nodes: list) -> int | None:
        """从最后一个 Linear 节点推断输出类别数"""
        if not nodes:
            return None
        for node in reversed(nodes):
            node_type = node.get("data", {}).get("type", "")
            params = node.get("data", {}).get("params", {})
            if node_type == "linear":
                return params.get("out_features", None)
        return None

    def export_model(self, format: str, output_path: str | None = None) -> dict:
        import torch
        import os
        from ..config import settings

        if self._model is None:
            raise Exception("没有可导出的模型，请先完成训练")

        export_dir = output_path or settings.EXPORTS_DIR
        os.makedirs(export_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if format == "onnx":
            return self._export_onnx(export_dir, timestamp)
        elif format == "torchscript":
            return self._export_torchscript(export_dir, timestamp)
        else:
            raise Exception(f"不支持的导出格式: {format}")

    def _export_onnx(self, output_dir: str, timestamp: str) -> dict:
        import torch

        if self._input_shape is None:
            raise Exception("无法推断输入形状，无法导出 ONNX")

        # 确保模型在评估模式
        self._model.eval()

        dummy_input = torch.randn(1, *self._input_shape)
        model_path = os.path.join(output_dir, f"model_{timestamp}.onnx")

        try:
            torch.onnx.export(
                self._model,
                dummy_input,
                model_path,
                input_names=["input"],
                output_names=["output"],
                dynamic_axes={
                    "input": {0: "batch_size"},
                    "output": {0: "batch_size"},
                },
                opset_version=11,
                export_params=True,
                do_constant_folding=True,
            )
        except Exception as e:
            raise Exception(f"ONNX 导出失败: {str(e)}")

        return {
            "format": "onnx",
            "path": model_path,
            "input_shape": self._input_shape,
            "num_classes": self._num_classes,
        }

    def _export_torchscript(self, output_dir: str, timestamp: str) -> dict:
        import torch

        if self._input_shape is None:
            raise Exception("无法推断输入形状，无法导出 TorchScript")

        # 确保模型在评估模式
        self._model.eval()

        dummy_input = torch.randn(1, *self._input_shape)
        model_path = os.path.join(output_dir, f"model_{timestamp}.pt")

        try:
            traced_model = torch.jit.trace(self._model, dummy_input)
            traced_model.save(model_path)
        except Exception as e:
            raise Exception(f"TorchScript 导出失败: {str(e)}")

        return {
            "format": "torchscript",
            "path": model_path,
            "input_shape": self._input_shape,
            "num_classes": self._num_classes,
        }