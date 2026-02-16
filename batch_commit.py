import subprocess
import os

def run_git(args, dry_run=False):
    cmd = ['git'] + args
    if dry_run:
        print(f"Would run: {' '.join(cmd)}")
        return
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f"Error running {' '.join(cmd)}: {e}")

def get_changes():
    # Use -z for safety with filenames, though simplified parsing
    # Actually just use standard porcelain for simplicity in this environment
    try:
        output = subprocess.check_output(['git', 'status', '-uall', '--porcelain']).decode('utf-8')
    except subprocess.CalledProcessError:
        return []
    
    files = []
    for line in output.split('\n'):
        if not line.strip():
            continue
        # Status is first 2 chars, then space, then path
        # If quoted, handle it
        raw_path = line[3:]
        if raw_path.startswith('"') and raw_path.endswith('"'):
            raw_path = raw_path[1:-1]
        files.append(raw_path)
    return files

def main():
    files = get_changes()
    total_files = len(files)
    print(f"Found {total_files} pending changes.")
    
    if total_files == 0:
        print("No changes to commit.")
        return

    target_commits = 111
    
    # If we have fewer files than target, we can't easily make unique commits without dummy ones.
    # User asked for "111 commits" total.
    # If we have more files, we iterate 110 times then dump the rest.
    
    limit = target_commits - 1
    if total_files <= target_commits:
        # Commit all individually
        limit = total_files - 1 # Leave 1 for final commit if exactly equal?
        # Actually if less, we just commit all 1 by 1.
        if total_files < target_commits:
             print(f"Note: Only {total_files} files available. Will create {total_files} commits.")
             limit = total_files

    committed_count = 0
    
    # Commit individual files
    for i in range(limit):
        f = files[i]
        print(f"[{i+1}/{target_commits}] Committing {f}...")
        run_git(['add', f])
        run_git(['commit', '-m', f'feat: update {os.path.basename(f)}'])
        committed_count += 1
        
    # Commit remaining
    remaining = files[limit:]
    if remaining:
        print(f"[{committed_count+1}/{target_commits}] Committing remaining {len(remaining)} files...")
        # Add all remaining
        # git add each one explicitly to avoid adding new untracked files that appeared during run? 
        # Safest is just add them.
        for f in remaining:
            run_git(['add', f])
        
        run_git(['commit', '-m', 'refactor: complete project updates'])
        committed_count += 1

    print(f"Finished. Created {committed_count} commits.")
    
    # Push
    print("Pushing to origin...")
    run_git(['push', 'origin', 'main'])

if __name__ == "__main__":
    main()
