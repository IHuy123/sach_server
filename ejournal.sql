-- Database: ejournal

-- DROP DATABASE IF EXISTS ejournal;

--  CREATE DATABASE ejournal
--      WITH
--      OWNER = postgres
--      ENCODING = 'UTF8'
--      LC_COLLATE = 'en_US.utf8'
--      LC_CTYPE = 'en_US.utf8'
--      TABLESPACE = pg_default
--      CONNECTION LIMIT = -1
-- 	 TEMPLATE template0
--      IS_TEMPLATE = False;

CREATE TYPE access_type AS ENUM ('UNIVERSITY', 'PERSONAL', 'STUDENT');
CREATE TYPE basic_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE user_status AS ENUM ('ONLINE', 'OFFLINE', 'INACTIVE');
CREATE TYPE article_status AS ENUM ('ACCEPTED', 'REJECTED', 'WAITING', 'PENDING', 'REVIEWED', 'REVISE', 'PUBLIC', 'RESTRICTED');

--role
CREATE TABLE role (
	id serial primary key,
	name text unique NOT NULL
);
	
--account
--0=male 1=female
CREATE TABLE account (
  id serial primary key,
  username text unique NOT NULL,
  password text NOT NULL,
  fullName text NOT NULL,
  avatar text DEFAULT NULL,
  gender boolean NOT NULL,
  phone text unique NOT NULL,
  email text unique NOT NULL,
  accessType access_type DEFAULT 'PERSONAL',
  status user_status DEFAULT 'OFFLINE',
  roleId integer NOT NULL references role(id)
);

--major
CREATE TABLE major (
  id serial primary key,
  name text NOT NULL,
  status basic_status DEFAULT 'ACTIVE'
);

--university
CREATE TABLE university (
  id serial primary key,
  name text NOT NULL,
  email text unique NOT NULL,
  mailType text unique NOT NULL,
  status basic_status DEFAULT 'ACTIVE'
);

--article (remove content)
CREATE TABLE article (
  id serial primary key,
  majorId integer NOT NULL references major(id),
  title text NOT NULL,
  summary text NOT NULL,
  doc text NOT NULL,
  openAccess boolean NOT NULL,
  status article_status NOT NULL DEFAULT 'WAITING',
  creatorId integer NOT NULL,
  creationTime TIMESTAMP without time zone NOT NULL
);

--article author
CREATE TABLE articleauthor (
  id serial primary key,
  articleId integer NOT NULL references article(id),
  accountId integer DEFAULT NULL references account(id),
  fullName text NOT NULL,
  email text NOT NULL,
  isCorresponding boolean NOT NULL 
);

--comment
-- CREATE TABLE "comment" (
  -- id serial primary key,
  -- articleId integer NOT NULL references article(id),
  -- content text NOT NULL
-- );

--review
--0=reject 1=accept
CREATE TABLE review (
  id serial primary key,
  articleId integer NOT NULL references article(id),
  accountId integer NOT NULL references account(id),
  content text DEFAULT NULL,
  suggest boolean DEFAULT NULL,
  creatorId integer NOT NULL,
  creationTime TIMESTAMP without time zone NOT NULL
);

--payment method
CREATE TABLE paymentmethod (
  id serial primary key,
  name text NOT NULL,
  status basic_status NOT NULL DEFAULT 'ACTIVE'
);

--personal transaction
CREATE TABLE personaltransaction (
  id serial primary key,
  articleId integer NOT NULL references article(id),
  accountId integer NOT NULL references account(id),
  amount NUMERIC NOT NULL,
  creatorId integer NOT NULL,
  creationTime TIMESTAMP without time zone NOT NULL
);

--university transaction
CREATE TABLE universitytransaction (
  id serial primary key,
  universityId integer NOT NULL references university(id),
  amount NUMERIC NOT NULL,
  expirationDate TIMESTAMP without time zone NOT NULL,
  isExpired boolean NOT NULL
);

--session
CREATE TABLE "sessions"(
	sid text primary key NOT NULL,
	sess json NOT NULL,
	expired TIMESTAMP without time zone NOT NULL
);

--Basic
INSERT INTO role("name") VALUES('ADMIN');
INSERT INTO role("name") VALUES('MEMBER');
INSERT INTO role("name") VALUES('AUTHOR');
INSERT INTO role("name") VALUES('REVIEWER');
INSERT INTO role("name") VALUES('EDITOR');
INSERT INTO role("name") VALUES('EDITOR_IN_CHIEF');

--Account
--password = 123qwe
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'admin','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','System Admin',null,false,'0908070601','adminwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'ADMIN'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'member','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Phạm Công Thứ',null,false,'0908070602','memberwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'MEMBER'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'author','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Đặng Thùy Dương',null,true,'0908070603','authorwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'AUTHOR'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'reviewer','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Ngô Linh Chi',null,true,'0908070604','reviewerwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'REVIEWER'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'editor','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Phạm Ngũ Lão',null,false,'0908070605','editorwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'EDITOR'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'ceditor','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Trần Đình Phong',null,false,'0908070606','chiefeditorwork@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'EDITOR_IN_CHIEF'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'reviewer1','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Trịnh Ngọc Bảo Ngân',null,true,'0988777666','reviewerwork1@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'REVIEWER'));
INSERT INTO account(username,password,fullname,avatar,gender,phone,email,accessType,status,roleid) VALUES(
	'reviewer2','$2a$10$ZoIAJaHPngX8rnZ6RSl.neoFg8WsP/yWOE.OhuQ6/ECArQkNFbiJy','Nguyễn Tuyết Minh',null,true,'0988776655','reviewerwork2@gmail.com','PERSONAL','OFFLINE',(SELECT id FROM role WHERE name = 'REVIEWER'));

--Major
INSERT INTO major("name",status) VALUES('Chính trị','ACTIVE');
INSERT INTO major("name",status) VALUES('Luật','ACTIVE');
INSERT INTO major("name",status) VALUES('Sinh học','ACTIVE');
INSERT INTO major("name",status) VALUES('Ngôn ngữ','ACTIVE');
INSERT INTO major("name",status) VALUES('Sức khỏe','ACTIVE');
INSERT INTO major("name",status) VALUES('Kinh tế','ACTIVE');
INSERT INTO major("name",status) VALUES('Tài chính','ACTIVE');
INSERT INTO major("name",status) VALUES('Kỹ thuật','ACTIVE');
INSERT INTO major("name",status) VALUES('Công nghệ','ACTIVE');
INSERT INTO major("name",status) VALUES('Giáo dục','ACTIVE');
INSERT INTO major("name",status) VALUES('Khoa học','ACTIVE');
INSERT INTO major("name",status) VALUES('Xã hội','ACTIVE');

--University
INSERT INTO university("name",email,mailType,status) VALUES('Đại học FPT','fpt@gmail.com','fpt.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Bách Khoa','bachkhoa@gmail.com','bk.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Sư phạm','supham@gmail.com','sp.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Thủy lợi','thuyloi@gmail.com','tl.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Tài nguyên và Môi trường','moitruong@gmail.com','tnmt.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Y Dược','yduoc@gmail.com','yd.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Điện lực','dienluc@gmail.com','dl.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Kiến trúc','kientruc@gmail.com','ktr.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Kỹ thuật','kythuat@gmail.com','kth.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Quốc gia','vietnam@gmail.com','qg.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Nông Lâm','nongnghiep@gmail.com','nl.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Công nghệ','hutech@gmail.com','cn.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Công nghiệp Thực phẩm','thucpham@gmail.com','tp.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Ngoại thương','ngoaithuong@gmail.com','nt.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Hàng hải','hanghai@gmail.com','hh.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Luật','luat@gmail.com','law.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Ngân hàng','nganhang@gmail.com','nh.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Kinh tế','kinhte@gmail.com','kt.edu.vn','ACTIVE');
INSERT INTO university("name",email,mailType,status) VALUES('Đại học Ngoại ngữ','ngoaingu@gmail.com','nn.edu.vn','ACTIVE');

--Payment Method
INSERT INTO paymentmethod("name",status) VALUES('Momo','ACTIVE');
INSERT INTO paymentmethod("name",status) VALUES('Paypal','ACTIVE');
INSERT INTO paymentmethod("name",status) VALUES('ZaloPay','ACTIVE');