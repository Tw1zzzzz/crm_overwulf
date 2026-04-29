import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Upload, Image, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PlayerType } from "@/types";

// Базовый URL API
const baseUrl = "";

// Отладочная информация об API URL
console.log('[AddPlayerForm] API URL:', baseUrl);

// Type данных формы
interface AddPlayerFormData {
 name: string;
 contacts: {
  vk: string;
  telegram: string;
  faceit: string;
  steam: string;
  nickname: string;
 };
 communicationLine: string;
 playerType: PlayerType;
}

// Type пропсов
interface AddPlayerFormProps {
 onPlayerAdded: () => void;
}

/**
 * Компонент формы добавления карточки игрока
 */
const AddPlayerForm: React.FC<AddPlayerFormProps> = ({ onPlayerAdded }) => {
 // Состояние формы
 const [formData, setFormData] = useState<AddPlayerFormData>({
  name: "",
  contacts: {
   vk: "",
   telegram: "",
   faceit: "",
   steam: "",
   nickname: ""
  },
  communicationLine: "",
  playerType: "team"
 });
 
 // Состояние загрузки
 const [isLoading, setIsLoading] = useState<boolean>(false);
 const [uploadingRoadmap, setUploadingRoadmap] = useState<boolean>(false);
 const [uploadingMindmap, setUploadingMindmap] = useState<boolean>(false);
 
 // Состояние для хранения временных файлов
 const [roadmapFile, setRoadmapFile] = useState<File | null>(null);
 const [mindmapFile, setMindmapFile] = useState<File | null>(null);
 
 // Состояние для предпросмотра ofображений
 const [roadmapPreview, setRoadmapPreview] = useState<string>("");
 const [mindmapPreview, setMindmapPreview] = useState<string>("");
 
 // Refs для загрузки файлов
 const roadmapFileRef = useRef<HTMLInputElement>(null);
 const mindmapFileRef = useRef<HTMLInputElement>(null);
 
 // Обработчик changes полей формы
 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  
  // Проверяем, является ли поле контактом
  if (name.includes(".")) {
   const [group, field] = name.split(".");
   if (group === "contacts") {
    setFormData(prev => ({
     ...prev,
     contacts: {
      ...prev.contacts,
      [field]: value
     }
    }));
   }
  } else {
   setFormData(prev => ({
    ...prev,
    [name]: value
   }));
  }
 };
 
 // Обработчик changes коммуникативной линии
 const handleCommunicationLineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setFormData(prev => ({
   ...prev,
   communicationLine: e.target.value
  }));
 };
 
 // Обработчик выбора файла Roadmap
 const handleRoadmapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   setRoadmapFile(file);
   // Создаем URL для предпросмотра
   const previewURL = URL.createObjectURL(file);
   setRoadmapPreview(previewURL);
  }
 };
 
 // Обработчик выбора файла Mindmap
 const handleMindmapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   setMindmapFile(file);
   // Создаем URL для предпросмотра
   const previewURL = URL.createObjectURL(file);
   setMindmapPreview(previewURL);
  }
 };
 
 // Открытие диалога выбора файла для Roadmap
 const handleRoadmapClick = () => {
  if (roadmapFileRef.current) {
   roadmapFileRef.current.click();
  }
 };
 
 // Открытие диалога выбора файла для Mindmap
 const handleMindmapClick = () => {
  if (mindmapFileRef.current) {
   mindmapFileRef.current.click();
  }
 };
 
 // Loading файла Roadmap на сервер
 const uploadRoadmap = async (userId: string): Promise<string> => {
  if (!roadmapFile) return "";
  
  try {
   setUploadingRoadmap(true);
   
   const token = localStorage.getItem('token');
   if (!token) throw new Error('Authorization required');
   
   const formData = new FormData();
   formData.append('roadmap', roadmapFile);
   
   const response = await axios.post(
    `${baseUrl}/api/player-cards/${userId}/roadmap`,
    formData,
    {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
     }
    }
   );
   
   if (response.data && response.data.roadmap) {
    return response.data.roadmap;
   }
   
   return "";
  } catch (error) {
   console.error("Error while uploading roadmap:", error);
   toast.error("Failed to load roadmap");
   return "";
  } finally {
   setUploadingRoadmap(false);
  }
 };
 
 // Loading файла Mindmap на сервер
 const uploadMindmap = async (userId: string): Promise<string> => {
  if (!mindmapFile) return "";
  
  try {
   setUploadingMindmap(true);
   
   const token = localStorage.getItem('token');
   if (!token) throw new Error('Authorization required');
   
   const formData = new FormData();
   formData.append('mindmap', mindmapFile);
   
   const response = await axios.post(
    `${baseUrl}/api/player-cards/${userId}/mindmap`,
    formData,
    {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
     }
    }
   );
   
   if (response.data && response.data.mindmap) {
    return response.data.mindmap;
   }
   
   return "";
  } catch (error) {
   console.error("Error while uploading mind map:", error);
   toast.error("Failed to load mind map");
   return "";
  } finally {
   setUploadingMindmap(false);
  }
 };
 
 // Обновление коммуникативной линии
 const updateCommunicationLine = async (userId: string): Promise<boolean> => {
  if (!formData.communicationLine) return true;
  
  try {
   const token = localStorage.getItem('token');
   if (!token) throw new Error('Authorization required');
   
   await axios.put(
    `${baseUrl}/api/player-cards/${userId}/communication-line`,
    { communicationLine: formData.communicationLine },
    {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
     }
    }
   );
   
   return true;
  } catch (error) {
   console.error("Error while updating communication line:", error);
   toast.error("Failed to update communication line");
   return false;
  }
 };
 
 // Обработчик отправки формы
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Проверка заполнения обязательных полей
  if (!formData.name.trim()) {
   toast.error("Player name is required");
   return;
  }

  if (!formData.contacts.faceit.trim()) {
   toast.error("FACEIT link is required to register a player");
   return;
  }
  
  try {
   setIsLoading(true);
   
   // Получаем токен of localStorage
   const token = localStorage.getItem('token');
   
   if (!token) {
    throw new Error('Authorization required');
   }
   
   console.log("[AddPlayerForm] Creating player and card:", formData);
   
   // 1. Создаем игрока
   let userId = '';
   
   try {
    // Генерируем случайный пароль и email для игрока
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const email = `${formData.name.toLowerCase().replace(/\s+/g, '.')}${Date.now()}@team.com`;
    
    const response = await axios.post(`${baseUrl}/api/auth/register`, 
     { 
      name: formData.name,
      email: email,
      password: randomPassword,
      role: "player",
      playerType: formData.playerType,
      faceitUrl: formData.contacts.faceit.trim(),
      nickname: formData.contacts.nickname.trim() || formData.name.trim()
     }, 
     {
      headers: {
       Authorization: `Bearer ${token}`,
       'Content-Type': 'application/json'
      }
     }
    );
    
    console.log("[AddPlayerForm] Create player API response:", response);
    
    if (!response || !response.data || !response.data.user || !response.data.user._id) {
     throw new Error("Failed to create player");
    }
    
    userId = response.data.user._id;
   } catch (apiError: any) {
    const errorMessage = apiError.response?.data?.message || "Unknown error while creating player";
    console.error("[AddPlayerForm] Error while creating player:", apiError);
    
    // Если ошибка связана с дубликатом email, попробуем снова с другим email
    if (errorMessage.includes('Email') && errorMessage.includes('already')) {
     toast.error("A player with this email already exists. Generating a new email...");
     throw new Error("Error while creating player: " + errorMessage);
    } else {
     throw new Error("Error while creating player: " + errorMessage);
    }
   }
   
   // 2. Обновляем контакты в автоматически созданной карточке игрока
   try {
    // Обновляем контакты игрока
    const contactsResponse = await axios.put(
     `${baseUrl}/api/player-cards/${userId}/contacts`,
     { contacts: formData.contacts },
     {
      headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
      }
     }
    );
    
    console.log("[AddPlayerForm] Contacts update API response:", contactsResponse);
    
    // Обновляем коммуникативную линию, если она указана
    if (formData.communicationLine) {
     await updateCommunicationLine(userId);
    }
   } catch (cardError: any) {
    console.error("[AddPlayerForm] Error while initializing player card:", cardError);
    const errorMessage = cardError.response?.data?.message || "Unknown error while working with the card";
    throw new Error("Error while initializing player card: " + errorMessage);
   }
   
   // 3. Загружаем файлы, если они выбраны
   const uploadTasks = [];
   
   if (roadmapFile) {
    uploadTasks.push(uploadRoadmap(userId));
   }
   
   if (mindmapFile) {
    uploadTasks.push(uploadMindmap(userId));
   }
   
   // Выполняем загрузку файлов параллельно, если они есть
   if (uploadTasks.length > 0) {
    try {
     await Promise.all(uploadTasks);
    } catch (fileError) {
     console.error("[AddPlayerForm] Error while uploading files:", fileError);
     // Не прерываем процесс, если не удалось загрузить файлы
     toast.error("Failed to load some maps. You can add them later.");
    }
   }
   
   toast.success("Player card created successfully");
   
   // Очищаем форму и предпросмотры
   setFormData({
    name: "",
    contacts: {
     vk: "",
     telegram: "",
     faceit: "",
     steam: "",
     nickname: ""
    },
    communicationLine: "",
    playerType: "team"
   });
   
   setRoadmapFile(null);
   setMindmapFile(null);
   setRoadmapPreview("");
   setMindmapPreview("");
   
   // Вызываем колбэк для обновления списка players
   onPlayerAdded();
  } catch (error: any) {
   console.error("[AddPlayerForm] Error:", error);
   
   // Показываем сообщение об ошибке
   if (error.response && error.response.data && error.response.data.message) {
    toast.error(`Error: ${error.response.data.message}`);
   } else if (error.message) {
    toast.error(`Error: ${error.message}`);
   } else {
    toast.error("Failed to create player card. Please try again.");
   }
  } finally {
   setIsLoading(false);
  }
 };
 
 // Очистка URL при размонтировании компонента
 React.useEffect(() => {
  return () => {
   if (roadmapPreview) URL.revokeObjectURL(roadmapPreview);
   if (mindmapPreview) URL.revokeObjectURL(mindmapPreview);
  };
 }, [roadmapPreview, mindmapPreview]);
 
 return (
  <div className="w-full max-w-4xl mx-auto">
   <form onSubmit={handleSubmit}>
    <Tabs defaultValue="info" className="w-full">
     <TabsList className="grid w-full grid-cols-4 mb-4">
      <TabsTrigger value="info">Basic information</TabsTrigger>
      <TabsTrigger value="contacts">Contacts</TabsTrigger>
      <TabsTrigger value="communication">Communication line</TabsTrigger>
      <TabsTrigger value="files">Development maps</TabsTrigger>
     </TabsList>
     
     <TabsContent value="info" className="space-y-4">
 <div className="space-y-2">
  <Label htmlFor="name">Player nickname</Label>
  <Input
   id="name"
   name="name"
   value={formData.name}
   onChange={handleChange}
   placeholder="Enter player nickname"
   required
   disabled={isLoading}
   className="text-lg py-6"
  />
  <p className="text-sm text-muted-foreground">
   Email и пароль будут сгенерированы автоматически
  </p>
 </div>

 <div className="space-y-2">
  <Label>Type игрока</Label>
  <div className="flex items-center space-x-4">
   <label className="flex items-center space-x-2">
    <input
     type="radio"
     checked={formData.playerType === "team"}
     onChange={() => setFormData(prev => ({ ...prev, playerType: "team" }))}
     className="h-4 w-4"
     disabled={isLoading}
    />
    <span>Член team</span>
   </label>
   <label className="flex items-center space-x-2">
    <input
     type="radio"
     checked={formData.playerType === "solo"}
     onChange={() => setFormData(prev => ({ ...prev, playerType: "solo" }))}
     className="h-4 w-4"
     disabled={isLoading}
    />
    <span>Одиночный игрок</span>
   </label>
  </div>
 </div>
</TabsContent>
     
     <TabsContent value="contacts" className="space-y-4">
      <div className="space-y-2">
       <Label htmlFor="nickname">Nickname</Label>
       <Input
        id="nickname"
        name="contacts.nickname"
        value={formData.contacts.nickname}
        onChange={handleChange}
        placeholder="Game nickname"
        disabled={isLoading}
        className="text-lg py-6"
       />
      </div>
      
      <div className="space-y-2">
       <Label htmlFor="vk">VK</Label>
       <Input
        id="vk"
        name="contacts.vk"
        value={formData.contacts.vk}
        onChange={handleChange}
        placeholder="https://vk.com/id"
        disabled={isLoading}
        className="text-lg py-6"
       />
      </div>
      
      <div className="space-y-2">
       <Label htmlFor="telegram">Telegram</Label>
       <Input
        id="telegram"
        name="contacts.telegram"
        value={formData.contacts.telegram}
        onChange={handleChange}
        placeholder="@username"
        disabled={isLoading}
        className="text-lg py-6"
       />
      </div>
      
      <div className="space-y-2">
       <Label htmlFor="faceit">Faceit</Label>
       <Input
        id="faceit"
        name="contacts.faceit"
        value={formData.contacts.faceit}
        onChange={handleChange}
        placeholder="https://www.faceit.com/en/players/"
        required
        disabled={isLoading}
        className="text-lg py-6"
       />
      </div>
      
      <div className="space-y-2">
       <Label htmlFor="steam">Steam</Label>
       <Input
        id="steam"
        name="contacts.steam"
        value={formData.contacts.steam}
        onChange={handleChange}
        placeholder="https://steamcommunity.com/id/"
        disabled={isLoading}
        className="text-lg py-6"
       />
      </div>
     </TabsContent>
     
     <TabsContent value="communication" className="space-y-4">
      <div className="space-y-2">
       <Label htmlFor="communicationLine">Communication line</Label>
       <Textarea
        id="communicationLine"
        value={formData.communicationLine}
        onChange={handleCommunicationLineChange}
        placeholder="Enter information about the player's communication line"
        disabled={isLoading}
        className="min-h-[200px] text-lg"
       />
      </div>
     </TabsContent>
     
     <TabsContent value="files" className="space-y-6">
      <div className="space-y-4">
       <Label>Roadmap</Label>
       {roadmapPreview ? (
        <div className="relative w-full max-h-[300px] overflow-auto bg-muted rounded-md flex justify-center border-2 border-primary">
         <img 
          src={roadmapPreview}
          alt="Roadmap Preview"
          className="max-w-full object-contain"
         />
        </div>
       ) : (
        <div 
         className="border-2 border-dashed border-primary/50 rounded-md p-12 text-center w-full cursor-pointer hover:bg-muted/50 transition-colors"
         onClick={handleRoadmapClick}
        >
         <div className="flex flex-col items-center">
          <Image className="h-16 w-16 text-primary mb-4" />
          <p className="text-lg text-primary">
           Click to upload Roadmap
          </p>
         </div>
        </div>
       )}
       
       <input
        type="file"
        ref={roadmapFileRef}
        className="hidden"
        accept="image/*"
        onChange={handleRoadmapChange}
       />
       
       <Button 
        type="button"
        onClick={handleRoadmapClick}
        variant="outline"
        className="w-full gap-2 py-6 text-lg"
        disabled={isLoading}
       >
        <Upload className="h-5 w-5" />
        {roadmapPreview ? "Change Roadmap" : "Choose Roadmap"}
       </Button>
      </div>
      
      <Separator className="my-8" />
      
      <div className="space-y-4">
       <Label>Mindmap</Label>
       {mindmapPreview ? (
        <div className="relative w-full max-h-[300px] overflow-auto bg-muted rounded-md flex justify-center border-2 border-primary">
         <img 
          src={mindmapPreview}
          alt="Mindmap Preview"
          className="max-w-full object-contain"
         />
        </div>
       ) : (
        <div 
         className="border-2 border-dashed border-primary/50 rounded-md p-12 text-center w-full cursor-pointer hover:bg-muted/50 transition-colors"
         onClick={handleMindmapClick}
        >
         <div className="flex flex-col items-center">
          <Image className="h-16 w-16 text-primary mb-4" />
          <p className="text-lg text-primary">
           Click to upload Mindmap
          </p>
         </div>
        </div>
       )}
       
       <input
        type="file"
        ref={mindmapFileRef}
        className="hidden"
        accept="image/*"
        onChange={handleMindmapChange}
       />
       
       <Button 
        type="button"
        onClick={handleMindmapClick}
        variant="outline"
        className="w-full gap-2 py-6 text-lg"
        disabled={isLoading}
       >
        <Upload className="h-5 w-5" />
        {mindmapPreview ? "Change Mindmap" : "Choose Mindmap"}
       </Button>
      </div>
     </TabsContent>
    </Tabs>
    
    <div className="mt-8">
     <Button 
      type="submit" 
      className="w-full gap-2 py-8 text-xl"
      size="lg"
      disabled={isLoading || uploadingRoadmap || uploadingMindmap}
     >
      {isLoading || uploadingRoadmap || uploadingMindmap ? (
       <>
        <Loader2 className="h-6 w-6 animate-spin" />
        {isLoading ? "Creating card..." : 
         uploadingRoadmap ? "Loading Roadmap..." : "Loading Mindmap..."}
       </>
      ) : (
       <>
        <Plus className="h-6 w-6" />
        Create карточку игрока
       </>
      )}
     </Button>
    </div>
   </form>
  </div>
 );
};

export default AddPlayerForm; 






