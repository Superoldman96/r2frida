include ./CONFIG

UNAME=$(shell uname)
SUDO?=sudo
DEPENDS=
CROSSARCH=x64
R2CFG_FLAGS?=
PWD=$(shell pwd)
PACKAGE_DIR?=${PWD}
USE_FRIDA_TOOLS?=0

R2_VERSION=$(shell r2 -qv)

DOCKCROSS=$(PWD)/../dockcross
R2PLUGDIR=/usr/lib/radare2/$(R2_VERSION)

all: root
	$(SUDO) rm -rf control data
	$(MAKE) clean
	mkdir -p data
	cp -rf root/* data
	$(MAKE) control
	$(MAKE) deb

root:
ifeq ($(UNAME),Darwin)
	cd ../.. && $(MAKE) clean ; ./configure --prefix=/usr $(R2CFG_FLAGS) ; npm i ; \
	$(DOCKCROSS) --image dockcross/linux-$(CROSSARCH) bash -c 'sh dist/build.sh'
else
	cd ../.. && $(MAKE) clean ; ./configure --prefix=/usr $(R2CFG_FLAGS) ; make USE_FRIDA_TOOLS=$(USE_FRIDA_TOOLS)
endif
	mkdir -p root/$(R2PLUGDIR)
	cp -f ../../io_frida.so root/$(R2PLUGDIR)
	mkdir -p root/usr/bin
	cp -f ../../src/r2frida-compile root/usr/bin/
	mkdir -p root/usr/share/man/man1
	cp -f ../../r2frida.1 root/usr/share/man/man1

purge: clean
	rm -rf root

summary:
	echo $(VERSION)

include deb.mk
