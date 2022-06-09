from sh import git, cd
from time import sleep
import shutil
import os
from pinatapy import PinataPy
# import asyncio
import requests

# from prisma import Prisma
# from prisma.models import NoteIngestion

# set variable from env file
PINATA_USER = os.environ['PINATA_USER']
PINATA_TOKEN = os.environ['PINATA_TOKEN']

pinata = PinataPy(PINATA_USER, PINATA_TOKEN)

GIT_REPO_DIR = '/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/notesdotsite'
IMAGES_PATH = '/Users/m1/Desktop/Code/apple-notes-ipfs/packages/icloud-bridge/data/ipfs'


def sync():
    file_out = '''---
type: screenshot
---
'''

    # loop through rtf files in directory
    for dirpath, dirnames, filenames in os.walk(IMAGES_PATH):
        print(filenames)
        filenames = list(filter(lambda x: x.endswith('.png'), filenames))

        if len(filenames) != 1:
            print('not enough/too many files')
            break

        filename = filenames[0]
        note_id = filename.split('.')[0]

        try:
            res = pinata.pin_file_to_ipfs('{}/{}'.format(dirpath, filename))
            print(res)
        except Exception as e:
            break

        if res['IpfsHash']:
            file_out += f'''
![](https://notes-site.mypinata.cloud/ipfs/{res['IpfsHash']})'''

        out_path = GIT_REPO_DIR + f'/Posts/{note_id}_scan.md'
        print('writing to', out_path)
        with open(out_path, 'w') as f:
            f.write(file_out)

        # upload to git
        cd(GIT_REPO_DIR)

        git('add', '.')
        try:
            git("commit", '-m "sync"')

            print('pushing to remote')
            git("push")
        except Exception as e:
            print('exception', e)

        print('clearing directory')
        shutil.rmtree(IMAGES_PATH)
        os.mkdir(IMAGES_PATH)

        # update db entry
        # prisma = Prisma()
        # await prisma.connect()

        # noteIngestion = await NoteIngestion.prisma().update(
        #     data={
        #         'ipfsHash': res['IpfsHash'],
        #         status
        #     }, where={
        #         'appleId': note_id
        #     }
        # )

        # make a POST request to notes.site with JSON body
        response = requests.post(
            'https://api.notes.site/api/conclude',
            json={
                'appleId': note_id,
            }
        )
        print(response.text)



if __name__ == "__main__":
    print('starting loop')
    while True:
        # asyncio.run(sync())
        sync()
        sleep(1)
