from typing import Any
import os

class DatasetManager:
    @staticmethod
    def get_available_datasets() -> list[dict]:
        return [
            {
                "name": "MNIST",
                "input_shape": [1, 28, 28],
                "num_classes": 10,
                "description": "手写数字识别",
            },
            {
                "name": "FashionMNIST",
                "input_shape": [1, 28, 28],
                "num_classes": 10,
                "description": "时尚物品分类",
            },
            {
                "name": "CIFAR10",
                "input_shape": [3, 32, 32],
                "num_classes": 10,
                "description": "CIFAR-10 图像分类",
            },
            {
                "name": "CIFAR100",
                "input_shape": [3, 32, 32],
                "num_classes": 100,
                "description": "CIFAR-100 图像分类（细粒度）",
            },
        ]
    
    @staticmethod
    def load_dataset(name: str, batch_size: int = 32, dataset_type: str = "builtin", dataset_config: dict = None):
        import torchvision
        import torchvision.transforms as transforms
        from torch.utils.data import DataLoader
        
        if dataset_type == "builtin":
            return DatasetManager._load_builtin_dataset(name, batch_size)
        elif dataset_type == "imagefolder":
            return DatasetManager._load_imagefolder(dataset_config, batch_size)
        elif dataset_type == "csv":
            return DatasetManager._load_csv_dataset(dataset_config, batch_size)
        elif dataset_type == "numpy":
            return DatasetManager._load_numpy_dataset(dataset_config, batch_size)
        elif dataset_type == "huggingface":
            return DatasetManager._load_huggingface_dataset(dataset_config, batch_size)
        else:
            raise ValueError(f"Unknown dataset type: {dataset_type}")
    
    @staticmethod
    def _load_builtin_dataset(name: str, batch_size: int):
        import torchvision
        import torchvision.transforms as transforms
        from torch.utils.data import DataLoader
        
        datasets = {
            "MNIST": lambda: (
                torchvision.datasets.MNIST(
                    root="./data",
                    train=True,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.1307,), (0.3081,))
                    ])
                ),
                torchvision.datasets.MNIST(
                    root="./data",
                    train=False,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.1307,), (0.3081,))
                    ])
                )
            ),
            "FashionMNIST": lambda: (
                torchvision.datasets.FashionMNIST(
                    root="./data",
                    train=True,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.2860,), (0.3530,))
                    ])
                ),
                torchvision.datasets.FashionMNIST(
                    root="./data",
                    train=False,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.2860,), (0.3530,))
                    ])
                )
            ),
            "CIFAR10": lambda: (
                torchvision.datasets.CIFAR10(
                    root="./data",
                    train=True,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
                    ])
                ),
                torchvision.datasets.CIFAR10(
                    root="./data",
                    train=False,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
                    ])
                )
            ),
            "CIFAR100": lambda: (
                torchvision.datasets.CIFAR100(
                    root="./data",
                    train=True,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
                    ])
                ),
                torchvision.datasets.CIFAR100(
                    root="./data",
                    train=False,
                    download=True,
                    transform=transforms.Compose([
                        transforms.ToTensor(),
                        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
                    ])
                )
            ),
        }
        
        if name not in datasets:
            raise ValueError(f"Unknown dataset: {name}")
        
        train_dataset, test_dataset = datasets[name]()
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, test_loader
    
    @staticmethod
    def _load_imagefolder(config: dict, batch_size: int):
        import torchvision.transforms as transforms
        from torchvision.datasets import ImageFolder
        from torch.utils.data import DataLoader, random_split
        
        train_dir = config.get("trainDir")
        val_dir = config.get("valDir")
        
        if not train_dir or not os.path.exists(train_dir):
            raise ValueError(f"训练集文件夹不存在: {train_dir}")
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
        ])
        
        train_dataset = ImageFolder(train_dir, transform=transform)
        
        if val_dir and os.path.exists(val_dir):
            val_dataset = ImageFolder(val_dir, transform=transform)
        else:
            # 自动划分 80% 训练，20% 验证
            train_size = int(0.8 * len(train_dataset))
            val_size = len(train_dataset) - train_size
            train_dataset, val_dataset = random_split(train_dataset, [train_size, val_size])
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader
    
    @staticmethod
    def _load_csv_dataset(config: dict, batch_size: int):
        import pandas as pd
        from PIL import Image
        from torch.utils.data import Dataset, DataLoader
        import torch
        import torchvision.transforms as transforms
        
        csv_path = config.get("csvPath")
        image_col = config.get("imageColumn", "image_path")
        label_col = config.get("labelColumn", "label")
        
        if not csv_path or not os.path.exists(csv_path):
            raise ValueError(f"CSV 文件不存在: {csv_path}")
        
        df = pd.read_csv(csv_path)
        
        if image_col not in df.columns or label_col not in df.columns:
            raise ValueError(f"CSV 文件中缺少列: {image_col} 或 {label_col}")
        
        class CSVDataset(Dataset):
            def __init__(self, dataframe, image_col, label_col, transform=None):
                self.df = dataframe
                self.image_col = image_col
                self.label_col = label_col
                self.transform = transform or transforms.Compose([
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
                ])
            
            def __len__(self):
                return len(self.df)
            
            def __getitem__(self, idx):
                row = self.df.iloc[idx]
                img_path = row[self.image_col]
                
                # 支持相对路径
                if not os.path.isabs(img_path):
                    base_dir = os.path.dirname(csv_path)
                    img_path = os.path.join(base_dir, img_path)
                
                image = Image.open(img_path).convert("RGB")
                image = self.transform(image)
                label = int(row[self.label_col])
                
                return image, label
        
        # 自动划分 80% 训练，20% 验证
        train_size = int(0.8 * len(df))
        val_size = len(df) - train_size
        
        train_df = df.iloc[:train_size].reset_index(drop=True)
        val_df = df.iloc[train_size:].reset_index(drop=True)
        
        train_dataset = CSVDataset(train_df, image_col, label_col)
        val_dataset = CSVDataset(val_df, image_col, label_col)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader
    
    @staticmethod
    def _load_numpy_dataset(config: dict, batch_size: int):
        import numpy as np
        from torch.utils.data import TensorDataset, DataLoader
        import torch
        
        npy_path = config.get("npyPath")
        x_train_key = config.get("xTrainKey", "x_train")
        y_train_key = config.get("yTrainKey", "y_train")
        x_val_key = config.get("xValKey", "x_val")
        y_val_key = config.get("yValKey", "y_val")
        
        if not npy_path or not os.path.exists(npy_path):
            raise ValueError(f"NumPy 文件不存在: {npy_path}")
        
        data = np.load(npy_path, allow_pickle=True)
        
        # 处理 .npz 文件
        if hasattr(data, 'files'):
            x_train = data[x_train_key]
            y_train = data[y_train_key]
            x_val = data.get(x_val_key)
            y_val = data.get(y_val_key)
        else:
            # 单个 .npy 文件，假设是字典
            if isinstance(data, np.ndarray) and data.dtype == object:
                data = data.item()
            x_train = data[x_train_key]
            y_train = data[y_train_key]
            x_val = data.get(x_val_key)
            y_val = data.get(y_val_key)
        
        # 转换为 torch tensors
        x_train = torch.from_numpy(x_train).float()
        y_train = torch.from_numpy(y_train).long()
        
        train_dataset = TensorDataset(x_train, y_train)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        
        if x_val is not None and y_val is not None:
            x_val = torch.from_numpy(x_val).float()
            y_val = torch.from_numpy(y_val).long()
            val_dataset = TensorDataset(x_val, y_val)
            val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        else:
            # 没有验证集，使用训练集的一部分
            val_size = int(0.2 * len(train_dataset))
            train_size = len(train_dataset) - val_size
            from torch.utils.data import random_split
            train_dataset, val_dataset = random_split(train_dataset, [train_size, val_size])
            train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
            val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader
    
    @staticmethod
    def _load_huggingface_dataset(config: dict, batch_size: int):
        from datasets import load_dataset
        from torch.utils.data import Dataset, DataLoader
        import torch
        import torchvision.transforms as transforms
        from PIL import Image
        import numpy as np
        
        dataset_name = config.get("hfDatasetName")
        config_name = config.get("hfConfigName") or None
        split = config.get("hfSplit", "train")
        image_col = config.get("hfImageColumn", "image")
        label_col = config.get("hfLabelColumn", "label")
        
        if not dataset_name:
            raise ValueError("Hugging Face 数据集名称不能为空")
        
        # 加载数据集
        try:
            if config_name:
                hf_dataset = load_dataset(dataset_name, config_name)
            else:
                hf_dataset = load_dataset(dataset_name)
        except Exception as e:
            raise ValueError(f"加载 Hugging Face 数据集失败: {str(e)}")
        
        # 获取可用的 split
        available_splits = list(hf_dataset.keys())
        
        # 确定训练和验证 split
        train_split = None
        val_split = None
        
        if "train" in available_splits:
            train_split = hf_dataset["train"]
        if "validation" in available_splits:
            val_split = hf_dataset["validation"]
        elif "test" in available_splits:
            val_split = hf_dataset["test"]
        
        # 如果没有 train split，使用用户指定的 split
        if train_split is None and split in available_splits:
            train_split = hf_dataset[split]
        
        if train_split is None:
            raise ValueError(f"数据集 {dataset_name} 中没有可用的训练数据，可用 splits: {available_splits}")
        
        # 自动划分验证集
        if val_split is None:
            from datasets import Dataset as HFDataset
            train_val = train_split.train_test_split(test_size=0.2)
            train_split = train_val["train"]
            val_split = train_val["test"]
        
        # 图像预处理
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
        ])
        
        class HFDatasetWrapper(Dataset):
            def __init__(self, hf_dataset, image_col, label_col, transform=None):
                self.dataset = hf_dataset
                self.image_col = image_col
                self.label_col = label_col
                self.transform = transform
                
                # 获取特征信息
                self.features = hf_dataset.features
                
                # 确定标签类型
                if label_col in self.features:
                    label_feature = self.features[label_col]
                    if hasattr(label_feature, 'names'):
                        self.num_classes = len(label_feature.names)
                    elif hasattr(label_feature, 'num_classes'):
                        self.num_classes = label_feature.num_classes
                    else:
                        self.num_classes = None
                else:
                    self.num_classes = None
            
            def __len__(self):
                return len(self.dataset)
            
            def __getitem__(self, idx):
                item = self.dataset[idx]
                
                # 处理图像
                image = item[self.image_col]
                if isinstance(image, dict):
                    # 如果是 PIL Image dict
                    image = Image.fromarray(np.array(image))
                elif isinstance(image, np.ndarray):
                    image = Image.fromarray(image)
                elif isinstance(image, Image.Image):
                    pass
                elif isinstance(image, str):
                    image = Image.open(image).convert("RGB")
                else:
                    # 尝试转换为 PIL Image
                    image = Image.fromarray(np.array(image))
                
                if image.mode != "RGB":
                    image = image.convert("RGB")
                
                if self.transform:
                    image = self.transform(image)
                
                # 处理标签
                label = item[self.label_col]
                if isinstance(label, str) and self.num_classes is not None:
                    # 如果标签是字符串，尝试映射到整数
                    label_feature = self.features[self.label_col]
                    if hasattr(label_feature, 'str2int'):
                        label = label_feature.str2int(label)
                    else:
                        label = 0
                
                label = int(label)
                
                return image, label
        
        train_dataset = HFDatasetWrapper(train_split, image_col, label_col, transform)
        val_dataset = HFDatasetWrapper(val_split, image_col, label_col, transform)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader
    
    @staticmethod
    def get_dataset_info(name: str, dataset_type: str = "builtin", dataset_config: dict = None) -> dict:
        """获取数据集的输入形状和类别数信息"""
        if dataset_type == "builtin":
            datasets = DatasetManager.get_available_datasets()
            for ds in datasets:
                if ds["name"] == name:
                    return {
                        "input_shape": ds.get("input_shape", [1, 28, 28]),
                        "num_classes": ds.get("num_classes", 10),
                        "name": name,
                    }
            return {"input_shape": [1, 28, 28], "num_classes": 10, "name": name}
        elif dataset_type == "imagefolder":
            # ImageFolder 通常是 RGB 图像，resize 到 224x224
            return {"input_shape": [3, 224, 224], "num_classes": None, "name": name}
        elif dataset_type == "csv":
            # CSV 数据集通常是 RGB 图像，resize 到 224x224
            return {"input_shape": [3, 224, 224], "num_classes": None, "name": name}
        elif dataset_type == "numpy":
            # NumPy 数据集: 尝试从文件推断
            npy_path = dataset_config.get("npyPath") if dataset_config else None
            if npy_path and os.path.exists(npy_path):
                import numpy as np
                try:
                    data = np.load(npy_path, allow_pickle=True)
                    if hasattr(data, 'files'):
                        x_key = dataset_config.get("xTrainKey", "x_train")
                        if x_key in data.files:
                            x_shape = data[x_key].shape
                            if len(x_shape) >= 3:
                                # 假设格式 (N, C, H, W) 或 (N, H, W, C)
                                if x_shape[-1] in [1, 3]:
                                    # (N, H, W, C)
                                    return {"input_shape": [x_shape[-1], x_shape[1], x_shape[2]], "num_classes": None, "name": name}
                                else:
                                    # (N, C, H, W)
                                    return {"input_shape": [x_shape[1], x_shape[2], x_shape[3]], "num_classes": None, "name": name}
                except Exception:
                    pass
            return {"input_shape": [1, 28, 28], "num_classes": None, "name": name}
        elif dataset_type == "huggingface":
            # Hugging Face 数据集通常是 RGB 图像，resize 到 224x224
            return {"input_shape": [3, 224, 224], "num_classes": None, "name": name}
        else:
            return {"input_shape": [1, 28, 28], "num_classes": 10, "name": name}

    @staticmethod
    def recommend_dataset(input_shape: list) -> str | None:
        datasets = DatasetManager.get_available_datasets()
        
        for dataset in datasets:
            if dataset["input_shape"] == input_shape:
                return dataset["name"]
        
        return None