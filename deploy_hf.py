from huggingface_hub import HfApi, login, create_repo
import os

# Login with your token
login("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")

api = HfApi()

# Your username/space name
space_name = "ewceniza-portfolio"
space_id = f"ewceniza/{space_name}"

# Check if space exists
try:
    api.get_space_info(repo_id=space_id, repo_type="space")
    print(f"Space {space_id} exists")
except Exception as e:
    print(f"Creating new space: {space_id}")
    create_repo(
        repo_id=space_id,
        repo_type="space",
        space_sdk="static",
    )

# Upload the dist folder
api.upload_folder(
    folder_path="dist",
    repo_id=space_id,
    repo_type="space",
    commit_message="Deploy portfolio"
)

print(f"Deployed to https://huggingface.co/spaces/{space_id}")