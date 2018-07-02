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

 Date: 02/07/2018 18:56:00
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
  `sys_path` varchar(500) DEFAULT NULL,
  `download_url` varchar(500) DEFAULT NULL COMMENT '下载地址',
  `preview_url` varchar(500) DEFAULT NULL COMMENT '预览地址',
  `create_time` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
