import bpy
import math
from bpy.app.handlers import persistent

# X:0m, Y:-10m, Z:1.5m にしています。
MY_LOCATION = (0.0, -10.0, 1.5)
MY_ROTATION = (math.radians(90), math.radians(0), math.radians(0))

def apply_camera_transform():
    for obj in bpy.context.scene.objects:
        if obj.type == 'CAMERA':
            obj.location = MY_LOCATION
            obj.rotation_euler = MY_ROTATION

@persistent
def on_file_load(dummy):
    if not bpy.data.is_saved:  
        apply_camera_transform()

@persistent
def on_object_added(scene):
    for obj in bpy.context.scene.objects:
        if obj.type == 'CAMERA' and obj.name.startswith("Camera") and not obj.get("cam_init"):
            obj.location = MY_LOCATION
            obj.rotation_euler = MY_ROTATION
            obj["cam_init"] = True

def register():
    bpy.app.handlers.load_post.append(on_file_load)
    bpy.app.handlers.depsgraph_update_post.append(on_object_added)

if __name__ == "__main__":
    register()
