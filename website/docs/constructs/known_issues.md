# Known issues

## CDK Synthesis stuck on Mac M processor family 

When using a Mac with the M processor family, during synthesis you may encounter an issue where the CDK synth process hangs indefinitely without throwing or exiting with an error. This issue is caused by the fact that esbuild is not natively compiled for the M architecture, and the underlying hardware doesn't support the necessary instructions used by esbuild.

To resolve this issue, you need to enable Rosetta on Docker, which allows Docker to run x86 binaries on the M architecture using emulation. With Rosetta enabled, Docker will be able to run esbuild and other x86 binaries on your Mac M processor without any issues.


## Unable to find image `IMAGE-URI`

During synthesis CDK will use a container to build and package assets, these are then uploaded to the CDK asset bucket. When using Docker with newer driver other than the default driver this can happen when building image for multi-architecture, Docker does not push the image to internal image store. This cause CDK to fail because it tries to pull an image that was only kept in the cache and not available in the local image store. 

To resolve the issue, you need to either:
    * To configure the builder with the default-load=true driver opt flag.
    * Configure Docker to use the default-driver as described in the Docker [documentation](https://docs.docker.com/build/builders/).

