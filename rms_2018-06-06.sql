# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.21)
# Database: rms
# Generation Time: 2018-06-06 10:23:59 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table files
# ------------------------------------------------------------

DROP TABLE IF EXISTS `files`;

CREATE TABLE `files` (
  `id` varchar(50) NOT NULL DEFAULT '' COMMENT '文件id',
  `file_name` varchar(200) DEFAULT NULL COMMENT '文件名',
  `md5` varchar(50) DEFAULT NULL COMMENT 'md5值',
  `download_url` varchar(500) DEFAULT NULL COMMENT '下载地址',
  `create_time` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;

INSERT INTO `files` (`id`, `file_name`, `md5`, `download_url`, `create_time`)
VALUES
	('5d40bb9e-f64c-4199-8055-68de40854587','ums1.0.zip','dfc82584df7420f4d6bf82e0fb4fc24c','/file/ZGZjODI1ODRkZjc0MjBmNGQ2YmY4MmUwZmI0ZmMyNGM=/ums1.0.zip','2018-06-06 18:08:54'),
	('63c2c3ff-2978-4d23-89f7-55c62afacf87','ebook3.0.zip','acbb417fd43be8b58512710554744711','/file/YWNiYjQxN2ZkNDNiZThiNTg1MTI3MTA1NTQ3NDQ3MTE=/ebook3.0.zip','2018-06-06 18:08:54');

/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
