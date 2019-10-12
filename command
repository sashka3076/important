tar xvfz

lsb_release
	-a sẽ hiển thị thông tin phiên bản Linux bạn đang dùng

du - kiểm tra dung lượng các directory
	-h để hiển thị dung lượng bằng thông số đọc hiểu được. 
	-c để hiển thị tổng cộng, 
	-s chỉ hiện thị tổng dung lượng mà không hiển thị chi tiết.

df - kiểm tra dung lượng các partition
	-h hiển thị theo những thông số để chúng ta đọc hiểu được

apt --fix-broken install

lscpu - Hiển thị thông tin CPU
lsblk - Hiển thị các thiết bị lưu trữ như ổ cứng, ổ đĩa flash,… (block devices)
lspci - Hiển thị các thiết bị PCI bao gồm các cổng USB, card đồ họa, network adapters,… 
dmidecode -t - thông tin về phần cứng bằng cách đọc dữ liệu từ các bảng DMI.
	memory hiển thị thông tin về ram memory
	processor hiển thị thông tin về vi xử lý
	system hiển thị thông tin hệ thống
	bios hiển thị thông tin về BIOS

cut -d: -f1 /etc/passwd
	Show list username on System
adduser --home /home/kali kali
	Add new user on linux

fdisk -l - thu thập thông tin về các file phân vùng hệ thống

find / -type s
	find all socket files on your system

service --status-all
	Danh sách trạng thái dịch vụ đang chạy
systemctl list-unit-files
	Danh sách tất cả các dịch vụ

ls $folder_to_count | wc -l
	Count file in folder


Ubuntu fix broken package (best solution)
http://www.iasptk.com/ubuntu-fix-broken-package-best-solution/

Error: #1698 - Access denied for user 'root'@'localhost'
Fixed: Edit /etc/dbconfig-common/phpmyadmin.conf file updating user/password values in the following sections
https://askubuntu.com/questions/763336/cannot-enter-phpmyadmin-as-root-mysql-5-7


Error: Can't install phpmyadmin
https://stackoverflow.com/questions/54679238/can-not-install-phpmyadmin


Error: mongod.service: Failed at step USER spawning /usr/bin/mkdir: No such process 
https://askubuntu.com/questions/748789/run-mongodb-service-as-daemon-of-systemd-on-ubuntu-15-10

Manjaro Linux

sources.list
//deb http://http.kali.org/kali kali-rolling main contrib non-free
//deb-src http://http.kali.org/kali kali-rolling main contrib non-free
//deb http://old.kali.org/kali sana main non-free contrib
//deb http://ftp.de.debian.org/debian wheezy main


deb http://http.kali.org/kali kali-rolling main non-free contrib
deb-src http://http.kali.org/kali kali-rolling main non-free contrib
deb http://deb.debian.org/debian stretch main
deb-src http://deb.debian.org/debian stretch main
deb http://deb.debian.org/debian stretch-updates main
deb-src http://deb.debian.org/debian stretch-updates main
deb http://security.debian.org/debian-security/ stretch/updates main
deb-src http://security.debian.org/debian-security/ stretch/updates main
