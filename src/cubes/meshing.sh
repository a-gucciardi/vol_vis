#!/bin/bash
# limitation : does not save position information
for file in ./synthseg/nifti7*.nii.gz; do
    base_name=$(basename "$file" | cut -d. -f1)
    echo "Processing: $file , basename : $base_name"
    /Users/arnaud/Documents/GitHub/nii2mesh/src/nii2mesh $file -p 1 ./synthseg/poly/$base_name.ply
done