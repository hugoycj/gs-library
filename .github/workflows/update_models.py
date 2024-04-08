import boto3
import os
import json
base_dir = 'models'
bucket = boto3.resource('s3').Bucket(name='3dgs-benchmark')

# Iterate through the directories
models = []
for dir_name in os.listdir(base_dir):
    # Check if the directory contains a config.json file
    config_file = os.path.join(base_dir, dir_name, 'config.json')
    if os.path.isfile(config_file):
        # Load the config.json file
        with open(config_file, 'r') as file:
            config = json.load(file)
        config['slug'] = dir_name
        # Add the model to the list
        models.append(config)

# Upload the models.json file to the S3 bucket
bucket.put_object(Body=json.dumps(models, indent=4), Key='models.json')
bucket.Object('models.json').Acl().put(ACL='public-read')

# Check the content of the uploaded file
obj = bucket.Object('models.json')
content = obj.get()['Body'].read().decode('utf-8')
uploaded_models = json.loads(content)

if uploaded_models == models:
    print('models.json file uploaded and made public successfully!')
else:
    print('Error: the uploaded models.json file does not match the local data.')