from psd_tools import PSDImage
from PIL import Image
import os
import json
from rectpack import newPacker

def pack_images(layers):
    """Pack images into a texture atlas using rectpack and return the packed layers with minimum bin size."""
    # Initialize packer
    packer = newPacker()

    # Add layers to the packer
    for layer in layers:
        packer.add_rect(layer['image'].width, layer['image'].height, rid=layer['name'])

    # 自适应 + 多张纹理集 有问题
    bin_size = 2048
    max_bin_size = 4096
    while bin_size <= max_bin_size:
        packer.add_bin(bin_size, bin_size, count=1)
        packer.pack()

        if len(packer[0]) == len(layers):
            break

        packer = newPacker()
        for layer in layers:
            packer.add_rect(layer['image'].width, layer['image'].height, rid=layer['name'])
        bin_size *= 2

    packed_layers = []
    for rect in packer.rect_list():
        b, x, y, w, h, rid = rect
        layer = next(l for l in layers if l['name'] == rid)
        packed_layers.append({
            'name': rid,
            'x': x,
            'y': y,
            'width': w,
            'height': h,
            'image': layer['image']
        })

    bin_width, bin_height = packer[0].width, packer[0].height

    return packed_layers, bin_width, bin_height

def crop_spritesheet(spritesheet):
    """Crop the spritesheet to remove empty space."""
    bbox = spritesheet.getbbox()
    if bbox:
        return spritesheet.crop(bbox)
    return spritesheet

# Input and output paths
psd_file_path = './static/0.psd'
output_image_path = './static/0.png'
output_json_path = './static/0.json'

# Ensure output directory exists
output_dir = os.path.dirname(output_image_path)
os.makedirs(output_dir, exist_ok=True)

# Parse PSD file
psd = PSDImage.open(psd_file_path)

# Extract layer image data
layers = []
for layer in psd.descendants():
    if layer.is_group() or not layer.is_visible():
        continue  # Skip group layers and invisible layers

    image = layer.composite()
    if image is None:
        continue  # Skip layers without image data

    layers.append({
        'name': layer.name,
        'image': image
    })

# Pack layer images
packed_layers, total_width, total_height = pack_images(layers)

# Create the spritesheet
spritesheet = Image.new('RGBA', (total_width, total_height))
spritesheet_data = {}

for layer in packed_layers:
    spritesheet.paste(layer['image'], (layer['x'], layer['y']))
    spritesheet_data[layer['name']] = {
        'x': layer['x'],
        'y': layer['y'],
        'width': layer['width'],
        'height': layer['height']
    }

# Crop the spritesheet to remove empty space
cropped_spritesheet = crop_spritesheet(spritesheet)

# Save the spritesheet
spritesheet.save(output_image_path)
print(f"Spritesheet saved as: {output_image_path}")

# Save the JSON description file
with open(output_json_path, 'w') as json_file:
    json.dump(spritesheet_data, json_file, indent=4)
print(f"JSON description file saved as: {output_json_path}")
