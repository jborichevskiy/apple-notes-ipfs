import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method == "POST") {
    console.log(req.body);

    const { appleId } = req.body;

    // finds latest noteIngestion
    const pendingNote = await prisma.noteIngestion.findFirst({
      where: {  
        appleId: appleId,
        status: "processed",
      }, 
      orderBy: {
        createdAt: "desc",
      }
    });

    if (pendingNote) {
      await prisma.noteIngestion.update({
        data: {
          status: "uploaded",
        },
        where: {
          id: pendingNote.id,
        },
      });
    }

    res.status(200).json({ status: "ok" });
  }
}
