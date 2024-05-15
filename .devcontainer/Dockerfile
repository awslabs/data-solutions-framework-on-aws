# Use the latest Amazon Linux 2023 base image
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

WORKDIR /root

RUN dnf install sudo -y

RUN sudo dnf update -y

RUN touch ~/.bashrc && source ~/.bashrc

RUN dnf -y install findutils

RUN dnf install -y git unzip tar

RUN dnf -y install nodejs20

RUN dnf -y install libcurl-devel

RUN sudo ln -s -f /usr/bin/node-20 /usr/bin/node
RUN sudo ln -s -f /usr/bin/npm-20 /usr/bin/npm

RUN dnf install -y rsync

RUN npm i -g npx

RUN npm i -g aws-cdk

RUN dnf -y install docker

RUN dnf -y install make

RUN npm install --global yarn

CMD dockerd &