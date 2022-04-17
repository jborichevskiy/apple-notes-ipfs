from sh import git, cd
from time import sleep
import shutil
import os
from pinatapy import PinataPy

pinata = PinataPy('9ad4e4e0e92a290e7a79', '1e0af608dfb0a1ac468d92fc3dac2165ac34fd281249262d14f65e52a7daf36c')


GIT_REPO_DIR = '/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/notessite'
IMAGES_PATH = '/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/ipfs'

def sync():
    file_out = '''---
type: screenshot
---
'''

    # loop through rtf files in directory
    for dirpath, dirnames, filenames in os.walk(IMAGES_PATH):
        print(filenames)

        sorted_filenames = sorted(filenames, key=lambda x: int(x.split('-')[1].split('.')[0]))

        previous = None
        for filename in sorted_filenames:
            without_extension = filename.split('.')[0]
            
            res = pinata.pin_file_to_ipfs('{}/{}'.format(dirpath, filename))
            print(res)

            note_id, index = without_extension.split('-')
            if res['IpfsHash'] != previous:
                file_out += f'''
![](https://notes-site.mypinata.cloud/ipfs/{res['IpfsHash']})'''
            else:
                break

            previous = res['IpfsHash']

            # if 'isDuplicate' in res:
            #     print('duplicate')
            #     break

            # stop loop upon is duplicate?

    out_path = GIT_REPO_DIR +f'/Posts/{note_id}_scan.md'
    print('writing to', out_path)
    with open(out_path, 'w') as f:
        f.write(file_out)


if __name__ == "__main__":
    # print('starting loop')
    # while True:
    sync()
    # sleep(.2)
