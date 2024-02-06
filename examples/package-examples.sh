#!/bin/bash

package_example()
{
  EXAMPLE_DIR=$1
  PACKAGE_DIR=$2
  PACKAGE_FILE=$(realpath -s $EXAMPLE_DIR)-example.zip
  echo Packaging $PACKAGE_FILE...
  cd $EXAMPLE_DIR
  # remove the projen header and append 'aws-data-solutions-framework'
  find . -type f -name 'requirements.txt' | while read file; do sed -i '1d; $a aws-data-solutions-framework' "$file"; done
  zip $PACKAGE_FILE  * -r -x "*.projen/*" "*pytest*" "*__pycache__*" "*.venv/*" "*cdk.out/*" "*.git*" "*package.json" "*requirements-dev.txt"
  mv $PACKAGE_FILE ../$PACKAGE_DIR/
}

PACKAGE_DIR=../dist/examples
echo Packaging examples...
mkdir -p $PACKAGE_DIR
for d in */ ; do
    (package_example "$d" "$PACKAGE_DIR")
done
echo Packaging examples complete