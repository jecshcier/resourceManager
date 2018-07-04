/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 50721
 Source Host           : localhost:3306
 Source Schema         : rms

 Target Server Type    : MySQL
 Target Server Version : 50721
 File Encoding         : 65001

 Date: 04/07/2018 16:58:20
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `id` varchar(50) NOT NULL DEFAULT '' COMMENT '文件id',
  `file_name` varchar(200) DEFAULT NULL COMMENT '文件名',
  `suffix_name` varchar(50) DEFAULT NULL COMMENT '后缀名',
  `file_size` int(100) DEFAULT NULL COMMENT '文件大小',
  `md5` varchar(50) DEFAULT NULL COMMENT 'md5值',
  `sys_path` varchar(500) DEFAULT NULL COMMENT '绝对路径',
  `download_url` varchar(500) DEFAULT NULL COMMENT '下载地址',
  `preview_url` varchar(500) DEFAULT NULL COMMENT '预览地址',
  `transfer` tinyint(1) DEFAULT '2' COMMENT '是否被处理（图片、视频等），2失败1成功处理0不需要处理',
  `create_time` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
