import nibabel as nib
import pyvista as pv
# import sqlite3

def convert_nifti_to_vtk(nifti_path, vtk_path):
    nifti_img = nib.load(nifti_path)
    data = nifti_img.get_fdata()
    affine = nifti_img.affine

    # Create a PyVista grid
    grid = pv.UniformGrid()
    grid.dimensions = data.shape
    grid.spacing = (affine[0, 0], affine[1, 1], affine[2, 2])
    grid.origin = (affine[0, 3], affine[1, 3], affine[2, 3])
    grid.point_data["values"] = data.flatten(order="F")

    # Save as VTK
    grid.save(vtk_path)

# Example usage
# convert_nifti_to_vtk("path/to/segmentation.nii", "path/to/segmentation.vtk")

# def setup_database(db_path):
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS segmentations (
#             id INTEGER PRIMARY KEY,
#             nifti_path TEXT,
#             vtk_path TEXT,
#             transform_matrix TEXT
#         )
#     ''')
#     conn.commit()
#     conn.close()

# Example usage
# setup_database("path/to/segmentations.db")