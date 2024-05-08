<p align="center">
  <img src="./web/src-web/src/assets/images/makonn_logo.svg" width="200" height="200">
</p>

## Table of contents

- [:grey_question: What is this?](#grey_question-what-is-this)
- [:pushpin: Installation](#pushpin-installation)
- [:hammer: Building from source](#hammer-building-from-source)
- [:blue_book: Licences](#blue_book-licences)
- [:camera: Screenshots](#camera-screenshots)

## :grey_question: What is this?

**Makoon** is a web application designed to make managing Kubernetes clusters in Proxmox VE as simple as possible.
With Makoon, users can manage MicroK8s multi-node clusters, Helm applications, and install/uninstall Kubernetes
resources without the need for complicated bash scripts, terraform or ansible.

### Key Features:

* Easy management of MicroK8s multi-node clusters
* User-friendly dashboard for managing Kubernetes resources
* Seamless integration with Helm applications
* Install/uninstall Kubernetes resources directly from the dashboard
* Support for multiple Proxmox VE nodes

### Additional information

* Tested with Proxmox: 8.2.2
* Supported MicroK8s versions:
    * 1.28/stable
    * 1.27/stable
    * 1.26/stable
    * 1.25/stable
    * 1.24/stable
* Support Ubuntu cloud images:
    * Ubuntu Server 22.04 LTS (Jammy Jellyfish)

## :pushpin: Installation

### Docker

```bash
# Create volume for Makoon data
docker volume create makoon_db
# Run container
docker run -d --name makoon -p8080:8080 --volume makoon_db:/app/data docker.io/sieradzki/makoon:latest
```

### Docker compose

```yaml
services:
  makoon:
    image: docker.io/sieradzki/makoon:latest
    ports:
      - 8080:8080
    volumes:
      - makoon_db:/app/data
volumes:
  makoon_db:
```

## :hammer: Building from source

To build a production package, run

```bash
docker build -t makoon:local .
```

## :blue_book: Licences

### Makoon can be used under two licences:

#### For personal use [PolyForm Noncommercial License 1.0.0](./LICENCE)

#### Internal Business Use [PolyForm Internal Use License 1.0.0](./LICENCE_INTERNAL_USE)

### Can I use Makoon?
- Can I use Makoon for personal project?\
**Yes.**
- Can I use Makoon for commercial project?\
**Yes, if you sell own software managed by Makoon, not Makoon itself.**
- Can I use Makoon commercially as a service (SaaS)\
**No.** You are not allowed to sell or provide to your customers this software as a service.
If you are interested in this kind of use, contact me. 

# :camera: Screenshots

![1_screenshot](./doc/screenshots/1_login.png)

![2_screenshot](./doc/screenshots/2_1_create_cluster_settings.png)

![3_screenshot](./doc/screenshots/2_2_create_cluster_nodes.png)

![4_screenshot](./doc/screenshots/3_list_of_clusters.png)

![5_screenshot](./doc/screenshots/4_1_cluster_details.png)

![6_screenshot](./doc/screenshots/4_2_helm_apps.png)

![7_screenshot](./doc/screenshots/4_3_add_chart.png)

![8_screenshot](./doc/screenshots/4_4_workload.png)

![9_screenshot](./doc/screenshots/4_5_logs.png)
