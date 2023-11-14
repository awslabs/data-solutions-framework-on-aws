'''
# Data solutions framework on AWS

Data solutions framework on AWS (DSF on AWS) is a framework for implementation and delivery of data solutions with built-in AWS best practices. DSF on AWS is an abstraction atop AWS services based on [AWS Cloud Development Kit](https://aws.amazon.com/cdk/) (CDK) L3 constructs, packaged as a library.

➡️ **More information on our [website](https://awslabs.github.io/data-solutions-framework-on-aws)**
'''
import abc
import builtins
import datetime
import enum
import typing

import jsii
import publication
import typing_extensions

from typeguard import check_type

from ._jsii import *

__all__ = [
    "governance",
    "processing",
    "storage",
    "utils",
]

publication.publish()

# Loading modules to ensure their types are registered with the jsii runtime library
from . import governance
from . import processing
from . import storage
from . import utils
