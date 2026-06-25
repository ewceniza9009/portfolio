from huggingface_hub import HfApi, login, create_repo, space_info

login("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")

api = HfApi()
space_id = "ewceniza/portfolio"

try:
    space_info(repo_id=space_id, repo_type="space")
    print(f"Space exists, updating...")
except:
    print(f"Creating new space: portfolio")
    create_repo(repo_id=space_id, repo_type="space", space_sdk="static", exist_ok=True)

api.upload_folder(
    folder_path="dist",
    repo_id=space_id,
    repo_type="space",
    commit_message="Update portfolio"
)

print(f"Done! https://huggingface.co/spaces/{space_id}")