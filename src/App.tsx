import { useState } from 'react'
import { Card, Button, Textarea } from '@material-tailwind/react'
import { Select, Option, Input } from "@material-tailwind/react";
import { Divider } from '@nextui-org/react';
import { FileUploader } from "react-drag-drop-files";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {  Typography,  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter } from "@material-tailwind/react";
  import Swal from 'sweetalert2';

  const gemini_key = (import.meta as any).env.VITE_GEMINI_API_KEY;
console.log(gemini_key)
const genAI = new GoogleGenerativeAI(gemini_key);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


const fileTypes = ["JPG", "PNG", "GIF"];
type questionType = {
  enonce?:string,
  reponse?:string,
  instructions?:string,
  id?:string,
  max?:number,
  photo:any,
}| {
  enonce:string,
  reponse:string,
  instructions:string,
  id?:string,
  max?:number,
  photo:null|undefined,
}

type travailType = {
  title:string,
  promotion:string,
  details:string,
  questions:questionType[],
  id?:string,
  max:number
}
type correctionType = {
  studentName:string,
  travail_id:string,
  cote:number
}

function App() {
const [travaux, settravaux] = useState<travailType[]>([])
const [file, setFile] = useState<File|File[]|null>(null);
const [targetQuestion, setTargetQuestion] = useState<questionType>({enonce:"", reponse:"", instructions:"", max:undefined, photo:undefined})
const [targetTravail, setTargetTravail] = useState<travailType>({title:"", promotion:"", details:"", questions:[], max:10})
const [corrections, setcorrections] = useState<correctionType[]>([]);
const handleChange = (file:File) => {
  console.log(file)
  setFile(file);
};
const [chat, setChat] = useState(model.startChat());


const [open, setOpen] = useState(false);
const [modalTp, setmodalTp] = useState(false);
const handleaddQuestion = ()=>{

  if(targetQuestion.photo){
    setTargetTravail({
      ...targetTravail, 
      questions:[...targetTravail.questions, {...targetQuestion, id:Array.from({length: 36}, () => Math.random().toString(36)[2]).join('')}]
    })
    setTargetQuestion({enonce:"", reponse:"", instructions:"", max:undefined, photo:undefined})
    return 
  }
  if((targetQuestion.enonce as string).length > 0 && (targetQuestion.instructions as string).length > 0 && (targetQuestion.reponse as string).length > 0){
    setTargetTravail({
      ...targetTravail, 
      questions:[...targetTravail.questions, {...targetQuestion, id:Array.from({length: 36}, () => Math.random().toString(36)[2]).join('')}]
    })
    setTargetQuestion({enonce:"", reponse:"", instructions:"", max:undefined, photo:undefined})

    return
  }

  Swal.fire({
    title:"Oops..",
    icon:"error",
    text:"Veuillez remplir tous les champs svp",
    timer: 3000,
    showCancelButton: false,
  })
}
const treat = async()=>{
  if(!file){
    return
  }
  if(!targetTravail){
    return
  }
  if(!Array.isArray(file)){
       //runAi(file.)
       const form = new FormData();
       form.append("question",  ` nous avons posé un travail d'evaluation de l'utilisateur dont voici le titre: ${targetTravail.title}$
       ton objectif est de pouvoir corrigé l'utilisateur et de lui attribuer une cote, les reponse de l'utilisateur sont dans la photo ci-dessus
       dans les question proposé par le professeur il ya des indications sur la manière dont tu dois corriger ainsi que les notes à attribué à chaque 
       question dans les cas où l'utilisateur répondait correctement et dans le cas contraire. la note maximale à attribuer à l'utilisateur ayant 
       réussi à resoudre toute les question est : ${targetTravail.max}
       les questions et reponses du professeur sont repris ici : ${JSON.stringify(targetTravail.questions)}
       voilà comment tu dois renvoyer ta correction, ce sera sous forme d'un json avec les éléments suivant: 
       nom : pour le nom de l'etudiant, 
       promotion: pour la promotion de l'étudiant, 
       travail: le titre du travail, 
       note: la cote obtenue ex: 3,


       exemple d'un json correcte : {
        "nom": "Alex Tshibangu",
        "promotion":"Bac 2 géographie", 
        "travail":"interrogation de chimie générale", 
        "note": 8
       }
       `)

       form.append("photo", file);
       const response = await fetch("http://127.0.0.1:3000/api/requestIa", {
        method:"POST", 
        body:form
       })
       const result = await response.json();
       console.log(result)
       try{
   const final = JSON.parse(result.Message.replace("```json\n", "").replace("```", ""))
   setcorrections([...corrections, {
    studentName:final.nom,
    cote:final.note,
    travail_id:targetTravail.id as string,
   }])
       }
       catch(err){
        console.log(err)
       }
  }else{

    const allrequest = file.map(f=>{
      return async()=>{
        const form = new FormData();
       form.append("question",  ` nous avons posé un travail d'evaluation de l'utilisateur dont voici le titre: ${targetTravail.title}$
       ton objectif est de pouvoir corrigé l'utilisateur et de lui attribuer une cote, les reponse de l'utilisateur sont dans la photo ci-dessus
       dans les question proposé par le professeur il ya des indications sur la manière dont tu dois corriger ainsi que les notes à attribué à chaque 
       question dans les cas où l'utilisateur répondait correctement et dans le cas contraire. la note maximale à attribuer à l'utilisateur ayant 
       réussi à resoudre toute les question est : ${targetTravail.max}
       les questions et reponses du professeur sont repris ici : ${JSON.stringify(targetTravail.questions)}
       voilà comment tu dois renvoyer ta correction, ce sera sous forme d'un json avec les éléments suivant: 
       nom : pour le nom de l'etudiant, 
       promotion: pour la promotion de l'étudiant, 
       travail: le titre du travail, 
       note: la cote obtenue ex: 3,


       exemple d'un json correcte : {
        "nom": "Alex Tshibangu",
        "promotion":"Bac 2 géographie", 
        "travail":"interrogation de chimie générale", 
        "note": 8
       }
       `)

       form.append("photo", f);
       const response = await fetch("http://127.0.0.1:3000/api/requestIa", {
        method:"POST", 
        body:form
       })
       const result = await response.json();
       console.log(result)
       try{
   const final = JSON.parse(result.Message.replace("```json\n", "").replace("```", ""))
   setcorrections([...corrections, {
    studentName:final.nom,
    cote:final.note,
    travail_id:targetTravail.id as string,
   }])
       }
       catch(err){
        console.log(err)
       }
      }
    })
    await Promise.all(allrequest)
  }
}

//const random_id = Array.from({length: 36}, () => Math.random().toString(36)[2]).join('');


const handleAddTravail = ()=>{
  console.log(targetTravail)
  if(targetTravail.title.length > 0 && targetTravail.details.length > 0 && targetTravail.promotion.length > 0  && targetTravail.questions.length > 0  && targetTravail.max!=undefined){
    settravaux([...travaux, {...targetTravail, id:Array.from({length: 36}, () => Math.random().toString(36)[2]).join('')}])
    setTargetTravail({title:"", promotion:"", details:"", questions:[], max:10})
    setTargetQuestion({enonce:"", reponse:"", instructions:"", max:undefined, photo:undefined})
    return
  }
}



  return (
    <>
      <Dialog
       open={open}
        size={ "md"}
        handler={()=>setOpen(!open)}
        {...{color: 'blue-gray'} as any}
      >
        <DialogHeader    {...{color: 'blue-gray'} as any}>Ajouter des nouvelles copies </DialogHeader>
        <DialogBody     {...{color: 'blue-gray'} as any}>
        <FileUploader handleChange={handleChange} name="file" multiple={true} types={fileTypes} className="w-full bg-gray-200 p-2 h-16 flex justify-center">
                    <div className="flex justify-center items-center bg-gray-100 p-8 rounded-lg">
                    selectionner un ou plusieurs fichiers
                    </div>
          </FileUploader>
          <div className="py-2">
            <Input {...{label:"File", type:"file", multiple:true}  as any} onChange={(e)=>{
              console.log((e.target as any).files[0])
              setFile((e.target as any).files[0])}}  />
          </div>
          <div className="py-2">
            <Button {...{id:"null", variant:"outlined"} as any} onClick={treat}>Traiter</Button>
          </div>
        </DialogBody>
        <DialogFooter 
          {...{color: 'blue-gray'} as any}
        >
          <Button
            variant="text"
            color="red"
            onClick={() => setOpen(false)}
            className="mr-1"
            {...{color: 'blue-gray'} as any}
          >
            <span>annuler</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={() => setOpen(false)}
            {...{color: 'black'} as any}
          >
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
       open={modalTp}
        size={ "lg"}
        handler={()=>setmodalTp(!modalTp)}
        {...{color: 'blue-gray'} as any}
      >
        <DialogHeader    {...{color: 'blue-gray'} as any}>Ajouter un nouveau Travail </DialogHeader>
        <DialogBody     {...{color: 'blue-gray', className:"overflow-y-auto h-[60vh]"} as any}>
         <div className="p-3 flex flex-col gap-4 items-center">
          <Input {...{label:"Titre"} as any} value={targetTravail.title} onInput={(e)=>setTargetTravail({...targetTravail, title:(e.target as HTMLInputElement).value})} />
          <Input {...{label:"Promotion"} as any}  value={targetTravail.promotion} onInput={(e)=>setTargetTravail({...targetTravail, promotion:(e.target as HTMLInputElement).value})}  />
          <Input {...{label:"Détails"} as any}  value={targetTravail.details} onInput={(e)=>setTargetTravail({...targetTravail, details:(e.target as HTMLInputElement).value})}   />
          <Input {...{label:"Cote Maximal", type:"number"} as any}  value={targetTravail.max} onInput={(e)=>setTargetTravail({...targetTravail, max:Number((e.target as HTMLInputElement).value)})}   />
         
         </div>
         <Divider className='my-4'></Divider>
          <div className="p-3">
            <div className="w-full py-4 flex flex-col gap-3">
            <Textarea {...{label:"Enoncé de la question"} as any}  value={targetQuestion.enonce} onInput={(e)=>setTargetQuestion({...targetQuestion, enonce:(e.target as HTMLTextAreaElement).value})}   />
            <Textarea {...{label:"Réponse de la question"} as any}  value={targetQuestion.reponse} onInput={(e)=>setTargetQuestion({...targetQuestion, reponse:(e.target as HTMLTextAreaElement).value})}   />
            <Textarea {...{label:"Instruction au correcteur en cas d'ambiguité"} as any}  value={targetQuestion.instructions} onInput={(e)=>setTargetQuestion({...targetQuestion, instructions:(e.target as HTMLTextAreaElement).value})}   />
            <Input {...{label:"Cote maximal de la question", type:"number"} as any}  value={targetQuestion.max} onInput={(e)=>setTargetQuestion({...targetQuestion, max:Number((e.target as HTMLTextAreaElement).value)})}   />
            <Input {...{label:"Photo de la auestion", type:"file"} as any}   onChange={(e)=>setTargetQuestion({...targetQuestion, photo:((e.target as HTMLInputElement).files as any)[0]})}   />
            
            </div>
            <div className="w-full py-4 flex gap-2 justify-start">
            <Button {...{variant:"gradient"} as any}  onClick={handleaddQuestion}>Ajouter une autre question </Button>
            <Button {...{variant:"gradient", color:"green"} as any}  onClick={handleAddTravail}>sauvegarder le travail </Button>
            </div>
          </div>
        </DialogBody>
        <DialogFooter 
          {...{color: 'blue-gray'} as any}
        >
          <Button
            variant="text"
            color="red"
            onClick={() => setmodalTp(false)}
            className="mr-1"
            {...{color: 'blue-gray'} as any}
          >
            <span>annuler</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={() => setmodalTp(false)}
            {...{color: 'black'} as any}
          >
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>
     <div className="p-3 rounded bg-neutral-200 h-screen w-full px-5">
      <div className="my-6 flex justify-start gap-3">
        <Button {...{className:" ", variant:"gradient", color:"black"} as any} onClick={() => setOpen(true)}> ajouter </Button>
        <div className="w-72">
      <Select label="Selectionner un travail " {...{color:"black"} as any} onChange={(e)=>{
        console.log(e)
        if(e !=undefined){
          setTargetTravail(travaux.find((tr)=>tr.id==(e as string) )as travailType)
        }
      }}>
        {travaux.map((tr)=>(
          <Option key={tr.id} value={tr.id}>{tr.title}</Option>
        ))}
        
      </Select>
    </div>
    <Button {...{className:" ", variant:"gradient", color:"black"} as any}> exporter </Button>
    <Button {...{className:" ", variant:"gradient", color:"black"} as any} onClick={()=>setmodalTp(true)}>Ajouter un travail </Button>
      </div>
           <Card {...{id:"card"} as any} className="p-2 bg-neutral-100 rounded w-full h-full rounded-lg">
                  <div className="my-6">
                  <table className="w-full max-w-screen table-auto text-left border rounded-lg overflow-x-auto">
        <thead>
          <tr>
            
              <th
             
                className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"
              >
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal leading-none opacity-70"
                  {...{variant:"small", color:"blue-gray"} as any}
                >
                  Name
                </Typography>
              </th>
              <th
             
             className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"
           >
             <Typography
               variant="small"
               color="blue-gray"
               className="font-normal leading-none opacity-70"
               {...{variant:"small", color:"blue-gray"} as any}
             >
               cote
             </Typography>
           </th>
          
          </tr>
        </thead>
        <tbody className='overflow-x-auto max-w-screen'>
          {corrections.map(({ studentName, cote }, index) => {
            const isLast = index === corrections.length - 1;
            const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
 
            return (
              <tr key={index} className="even:bg-gray-300">
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                    {...{variant:"small", color:"blue-gray"} as any}
                  >
                    {studentName}
                  </Typography>
                </td>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                    {...{variant:"small", color:"blue-gray"} as any}
                  >
                    {cote}
                  </Typography>
                </td>
                
              </tr>
            );
          })}
        </tbody>
      </table>
                  </div>
           </Card>
     </div>
    </>
  )
}

export default App
