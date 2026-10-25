// 可编辑的内容:照片、时间线、情话
const PASSWORD = "20240220";
const START = new Date(2024, 1, 20, 0, 0, 0); // 2024-02-20

// 把照片放进 photos/ 目录,然后在这里添加一行
const PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  src: `photos/${String(i + 1).padStart(2, "0")}.jpg`,
  caption: "",
}));

// 两地坐标(纬度, 经度),用于计算直线距离
const ME = { name: "北京", lat: 39.9042, lon: 116.4074 };
const HER = { name: "深圳", lat: 22.5431, lon: 114.0579 };

const QUOTES = [
  "年年有风，风吹年年，慢慢即漫漫。",
];
