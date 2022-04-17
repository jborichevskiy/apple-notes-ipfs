from unicodedata import name
from sh import git, cd
from time import sleep
import shutil
import os

GIT_REPO_DIR = '/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/notessite'
GIT_DEST = GIT_REPO_DIR + '/Posts'

def sync():
    # textutil * -convert html

    # loop through rtf files in directory
    for dirpath, dirnames, filenames in os.walk(GIT_DEST):
        # check if rtf file exists
        for filename in filenames:
            name, extension = filename.split('.')

            if not os.path.exists(os.path.join(dirpath, name + '.html')) and extension == 'rtf':
                cmd = f'textutil {GIT_DEST}/{name}.rtf -convert html'
                print('cmd', cmd)
                os.system(cmd)

    cd(GIT_DEST)
    git('add', '.')
    try:
        git("commit", '-m "sync"')
        print('pushing to remote')
        git("push")
    except:
        print('no changes to push (or something else?)') 

if __name__ == "__main__":
    print('starting loop')
    while True:
        sync()
        sleep(.2)
