import React, { useState, useRef, useEffect } from 'react';
import { 
 X, 
 Save, 
 Upload, 
 FileText, 
 Image, 
 Paperclip,
 Users,
 Shield,
 Eye,
 Plus,
 Trash2,
 Clock
} from 'lucide-react';
import { 
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
 Select, 
 SelectContent, 
 SelectItem, 
 SelectTrigger, 
 SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from "@/styles/theme";
import {
 createTeamReport,
 updateTeamReport,
 getPlayers,
 TeamReportData,
 TeamReportResponse
} from '@/lib/api';

interface TeamReportModalProps {
 onClose: () => void;
 onSave: () => void;
 report?: TeamReportResponse | null;
}

interface ReportSection {
 id: string;
 title: string;
 content: string;
 type: string;
}

interface Player {
 _id: string;
 name: string;
 email: string;
 avatar?: string;
}

const TeamReportModal: React.FC<TeamReportModalProps> = ({
 onClose,
 onSave,
 report
}) => {
 // Состояния формы
 const [formData, setFormData] = useState<{
  title: string;
  description: string;
  type: TeamReportData['type'];
  visibility: TeamReportData['visibility'];
  content: {
   summary: string;
   details: string;
   recommendations: string[];
   sections: ReportSection[];
  };
  assignedTo: string[];
  viewableBy: string[];
 }>({
  title: '',
  description: '',
  type: 'weekly',
  visibility: 'team',
  content: {
   summary: '',
   details: '',
   recommendations: [],
   sections: []
  },
  assignedTo: [],
  viewableBy: []
 });

 const [files, setFiles] = useState<File[]>([]);
 const [players, setPlayers] = useState<Player[]>([]);
 const [loading, setLoading] = useState(false);
 const [dragActive, setDragActive] = useState(false);
 const [newRecommendation, setNewRecommendation] = useState('');
 const [newSection, setNewSection] = useState<{ title: string; content: string; type: string }>({
  title: '',
  content: '',
  type: 'text'
 });

 const fileInputRef = useRef<HTMLInputElement>(null);
 const { toast } = useToast();
 const { user } = useAuth();

 const isEdit = !!report;

 // Загрузка данных при открытии
 useEffect(() => {
  fetchPlayers();
  
  if (report) {
   // Заполняем форму данными report для редактирования
   setFormData({
    title: report.title,
    description: report.description || '',
    type: report.type,
    visibility: report.visibility,
    content: {
     summary: report.content.summary || '',
     details: report.content.details || '',
     recommendations: report.content.recommendations || [],
     sections: report.content.sections?.map(section => ({
      id: Math.random().toString(36).substr(2, 9),
      title: section.title,
      content: section.content,
      type: section.type || 'text'
     })) || []
    },
    assignedTo: report.assignedTo?.map(user => user._id) || [],
    viewableBy: report.viewableBy?.map(user => user._id) || []
   });
  }
 }, [report]);

 const fetchPlayers = async () => {
  try {
   const response = await getPlayers();
   setPlayers(response.data);
  } catch (error: any) {
   console.error('Player loading error:', error);
  }
 };

 // Обработчики формы
 const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({
   ...prev,
   [field]: value
  }));
 };

 const handleContentChange = (field: string, value: any) => {
  setFormData(prev => ({
   ...prev,
   content: {
    ...prev.content,
    [field]: value
   }
  }));
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files || []);
  setFiles(prev => [...prev, ...selectedFiles].slice(0, 5)); // Maximum 5 файлов
 };

 const removeFile = (index: number) => {
  setFiles(prev => prev.filter((_, i) => i !== index));
 };

 const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(true);
 };

 const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(false);
 };

 const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(false);
  
  const droppedFiles = Array.from(e.dataTransfer.files);
  setFiles(prev => [...prev, ...droppedFiles].slice(0, 5));
 };

 // Управление рекомендациями
 const addRecommendation = () => {
  if (newRecommendation.trim()) {
   handleContentChange('recommendations', [
    ...formData.content.recommendations,
    newRecommendation.trim()
   ]);
   setNewRecommendation('');
  }
 };

 const removeRecommendation = (index: number) => {
  handleContentChange('recommendations', 
   formData.content.recommendations.filter((_, i) => i !== index)
  );
 };

 // Управление секциями
 const addSection = () => {
  if (newSection.title.trim() && newSection.content.trim()) {
   const section: ReportSection = {
    id: Math.random().toString(36).substr(2, 9),
    title: newSection.title.trim(),
    content: newSection.content.trim(),
    type: newSection.type
   };

   handleContentChange('sections', [
    ...formData.content.sections,
    section
   ]);

   setNewSection({ title: '', content: '', type: 'text' });
  }
 };

 const removeSection = (id: string) => {
  handleContentChange('sections', 
   formData.content.sections.filter(section => section.id !== id)
  );
 };

 const updateSection = (id: string, field: string, value: string) => {
  handleContentChange('sections', 
   formData.content.sections.map(section => 
    section.id === id ? { ...section, [field]: value } : section
   )
  );
 };

 // Сохранение report
 const handleSave = async () => {
  // Проверяем, что пользователь загружен
  if (!user) {
   toast({
    title: "Error",
    description: "You must sign in to create reports",
    variant: "destructive",
   });
   return;
  }

  if (!formData.title.trim()) {
   toast({
    title: "Error",
    description: "Enter report title",
    variant: "destructive",
   });
   return;
  }

  if (!formData.content.summary.trim()) {
   toast({
    title: "Error", 
    description: "Enter report summary",
    variant: "destructive",
   });
   return;
  }

  // Проверка минимальной длины краткого ofложения (10 characters)
  if (formData.content.summary.trim().length < 10) {
   toast({
    title: "Error",
    description: "Summary must contain at least 10 characters",
    variant: "destructive",
   });
   return;
  }

  // Проверка максимальной длины краткого ofложения (1000 characters)
  if (formData.content.summary.trim().length > 1000) {
   toast({
    title: "Error",
    description: "Summary must not exceed 1000 characters",
    variant: "destructive",
   });
   return;
  }

  if (!formData.content.details.trim()) {
   toast({
    title: "Error",
    description: "Enter detailed report description", 
    variant: "destructive",
   });
   return;
  }

  // Проверка минимальной длины подробного описания (20 characters)
  if (formData.content.details.trim().length < 20) {
   toast({
    title: "Error",
    description: "Detailed description must contain at least 20 characters",
    variant: "destructive",
   });
   return;
  }

  // Проверка максимальной длины подробного описания (5000 characters)
  if (formData.content.details.trim().length > 5000) {
   toast({
    title: "Error",
    description: "Detailed description must not exceed 5000 characters",
    variant: "destructive",
   });
   return;
  }

  setLoading(true);

  try {
   // Формируем структуру данных согласно серверной модели
   const reportData: TeamReportData = {
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    content: {
     // Создаем sections of summary и details
     sections: [
      {
       title: "Summary",
       content: formData.content.summary.trim(),
       order: 0,
       type: 'text' as const
      },
      {
       title: "Detailed description", 
       content: formData.content.details.trim(),
       order: 1,
       type: 'text' as const
      }
     ],
     // Дополнительные поля
     summary: formData.content.summary.trim(),
     details: formData.content.details.trim(),
     recommendations: formData.content.recommendations.filter(rec => rec.trim().length > 0),
     tags: []
    },
    type: formData.type,
    visibility: formData.visibility,
    assignedTo: formData.assignedTo.length > 0 ? formData.assignedTo : undefined,
    viewableBy: formData.viewableBy.length > 0 ? formData.viewableBy : undefined,
   };

   console.log('📤 [TeamReportModal] Sending report data:', reportData);

   await createTeamReport(reportData, files);
   
   toast({
    title: "Success",
    description: "Report created successfully",
   });
   
   onSave();
   onClose();
  } catch (error: any) {
   console.error('Report save error:', error);
   toast({
    title: "Error",
    description: error.response?.data?.message || "Failed to create report",
    variant: "destructive",
   });
  } finally {
   setLoading(false);
  }
 };

 const getPlayerName = (playerId: string): string => {
  const player = players.find(p => p._id === playerId);
  return player ? player.name : playerId;
 };

 const togglePlayerSelection = (playerId: string, type: 'assignedTo' | 'viewableBy') => {
  const currentList = formData[type];
  const newList = currentList.includes(playerId)
   ? currentList.filter(id => id !== playerId)
   : [...currentList, playerId];
  
  handleInputChange(type, newList);
 };

 return (
  <Dialog open={true} onOpenChange={onClose}>
   <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: COLORS.cardBackground }}>
    <DialogHeader>
     <DialogTitle style={{ color: COLORS.textColor }}>
      {isEdit ? 'Edit report' : 'Create team report'}
     </DialogTitle>
     <DialogDescription style={{ color: COLORS.textColorSecondary }}>
      {isEdit 
       ? 'Update the existing team report'
       : 'Create a new team report with a detailed description and recommendations'
      }
     </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
     {/* Basic information */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <Label htmlFor="title" style={{ color: COLORS.textColor }}>Report title *</Label>
       <Input
        id="title"
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        placeholder="Enter report title"
        style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
       />
      </div>

      <div>
       <Label htmlFor="type" style={{ color: COLORS.textColor }}>Report type</Label>
       <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
        <SelectTrigger style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}>
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="weekly">Weekly</SelectItem>
         <SelectItem value="monthly">Monthly</SelectItem>
         <SelectItem value="match_analysis">Match analysis</SelectItem>
         <SelectItem value="training_report">Training report</SelectItem>
         <SelectItem value="custom">Special</SelectItem>
        </SelectContent>
       </Select>
      </div>
     </div>

     <div>
      <Label htmlFor="description" style={{ color: COLORS.textColor }}>Description</Label>
      <Input
       id="description"
       value={formData.description}
       onChange={(e) => handleInputChange('description', e.target.value)}
       placeholder="Short report description"
       style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
      />
     </div>

     <div>
      <Label htmlFor="visibility" style={{ color: COLORS.textColor }}>Visibility</Label>
      <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
       <SelectTrigger style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="team">
         <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team
         </div>
        </SelectItem>
        <SelectItem value="staff">
         <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Staff
         </div>
        </SelectItem>
        <SelectItem value="public">
         <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Public
         </div>
        </SelectItem>
       </SelectContent>
      </Select>
     </div>

     {/* Report content */}
     <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: COLORS.textColor }}>
       Report content
      </h3>

      <div>
       <div className="flex justify-between items-center mb-1">
        <Label htmlFor="summary" style={{ color: COLORS.textColor }}>Summary *</Label>
        <span className="text-sm" style={{ 
         color: formData.content.summary.length < 10 ? '#ef4444' : 
            formData.content.summary.length > 1000 ? '#ef4444' : COLORS.textColorSecondary 
        }}>
         {formData.content.summary.length}/1000 (min. 10)
        </span>
       </div>
       <Textarea
        id="summary"
        value={formData.content.summary}
        onChange={(e) => handleContentChange('summary', e.target.value)}
        placeholder="Summary of report highlights (minimum 10 characters)"
        rows={3}
        style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
       />
       {formData.content.summary.length > 0 && formData.content.summary.length < 10 && (
        <p className="text-sm text-red-500 mt-1">
         Still needed {10 - formData.content.summary.length} characters
        </p>
       )}
      </div>

      <div>
       <div className="flex justify-between items-center mb-1">
        <Label htmlFor="details" style={{ color: COLORS.textColor }}>Detailed description *</Label>
        <span className="text-sm" style={{ 
         color: formData.content.details.length < 20 ? '#ef4444' : 
            formData.content.details.length > 5000 ? '#ef4444' : COLORS.textColorSecondary 
        }}>
         {formData.content.details.length}/5000 (min. 20)
        </span>
       </div>
       <Textarea
        id="details"
        value={formData.content.details}
        onChange={(e) => handleContentChange('details', e.target.value)}
        placeholder="Detailed event description, analysis, conclusions (minimum 20 characters)"
        rows={6}
        style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
       />
       {formData.content.details.length > 0 && formData.content.details.length < 20 && (
        <p className="text-sm text-red-500 mt-1">
         Still needed {20 - formData.content.details.length} characters
        </p>
       )}
      </div>

      {/* Recommendations */}
      <div>
       <Label style={{ color: COLORS.textColor }}>Recommendations</Label>
       <div className="space-y-2">
        {formData.content.recommendations.map((rec, index) => (
         <div key={index} className="flex items-center gap-2">
          <Badge variant="secondary" className="flex-1 justify-start">
           {rec}
          </Badge>
          <Button
           variant="outline"
           size="sm"
           onClick={() => removeRecommendation(index)}
          >
           <Trash2 className="h-4 w-4" />
          </Button>
         </div>
        ))}
        
        <div className="flex gap-2">
         <Input
          value={newRecommendation}
          onChange={(e) => setNewRecommendation(e.target.value)}
          placeholder="Add recommendation"
          style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
          onKeyPress={(e) => e.key === 'Enter' && addRecommendation()}
         />
         <Button onClick={addRecommendation} variant="outline">
          <Plus className="h-4 w-4" />
         </Button>
        </div>
       </div>
      </div>

      {/* Additional sections */}
      <div>
       <Label style={{ color: COLORS.textColor }}>Additional sections</Label>
       <div className="space-y-3">
        {formData.content.sections.map((section) => (
         <Card key={section.id} style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}>
          <CardContent className="pt-4">
           <div className="flex justify-between items-start mb-2">
            <Input
             value={section.title}
             onChange={(e) => updateSection(section.id, 'title', e.target.value)}
             placeholder="Section title"
             className="font-semibold"
             style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
            />
            <Button
             variant="outline"
             size="sm"
             onClick={() => removeSection(section.id)}
             className="ml-2"
            >
             <Trash2 className="h-4 w-4" />
            </Button>
           </div>
           <Textarea
            value={section.content}
            onChange={(e) => updateSection(section.id, 'content', e.target.value)}
            placeholder="Section content"
            rows={3}
            style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
           />
          </CardContent>
         </Card>
        ))}

        <Card style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}>
         <CardContent className="pt-4">
          <div className="space-y-2">
           <Input
            value={newSection.title}
            onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
            placeholder="New section title"
            style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
           />
           <Textarea
            value={newSection.content}
            onChange={(e) => setNewSection(prev => ({ ...prev, content: e.target.value }))}
            placeholder="New section content"
            rows={3}
            style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
           />
           <Button onClick={addSection} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add section
           </Button>
          </div>
         </CardContent>
        </Card>
       </div>
      </div>
     </div>

     {/* File upload (только для создания) */}
     {!isEdit && (
      <div>
       <Label style={{ color: COLORS.textColor }}>Files and attachments</Label>
       <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
         dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
        }`}
        style={{ borderColor: dragActive ? COLORS.primary : COLORS.borderColor }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
       >
        <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: COLORS.textColorSecondary }} />
        <p style={{ color: COLORS.textColor }}>
         Drag files here or click to choose
        </p>
        <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
         Supported: images, documents, PDF (up to 5 files, 10 MB each)
        </p>
        <input
         ref={fileInputRef}
         type="file"
         multiple
         accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
         onChange={handleFileChange}
         className="hidden"
        />
       </div>

       {files.length > 0 && (
        <div className="mt-4 space-y-2">
         {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: COLORS.backgroundColor }}>
           {file.type.startsWith('image/') ? (
            <Image className="h-4 w-4" style={{ color: COLORS.textColorSecondary }} />
           ) : (
            <Paperclip className="h-4 w-4" style={{ color: COLORS.textColorSecondary }} />
           )}
           <span className="flex-1" style={{ color: COLORS.textColor }}>{file.name}</span>
           <span className="text-sm" style={{ color: COLORS.textColorSecondary }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
           </span>
           <Button
            variant="outline"
            size="sm"
            onClick={() => removeFile(index)}
           >
            <Trash2 className="h-4 w-4" />
           </Button>
          </div>
         ))}
        </div>
       )}
      </div>
     )}

     {/* Assign players */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <Label style={{ color: COLORS.textColor }}>Assign to players</Label>
       <div className="border rounded-lg p-3 max-h-32 overflow-y-auto" style={{ borderColor: COLORS.borderColor }}>
        {players.map((player) => (
         <div key={player._id} className="flex items-center gap-2 py-1">
          <input
           type="checkbox"
           checked={formData.assignedTo.includes(player._id)}
           onChange={() => togglePlayerSelection(player._id, 'assignedTo')}
          />
          <span style={{ color: COLORS.textColor }}>{player.name}</span>
         </div>
        ))}
       </div>
      </div>

      <div>
       <Label style={{ color: COLORS.textColor }}>Allow viewing</Label>
       <div className="border rounded-lg p-3 max-h-32 overflow-y-auto" style={{ borderColor: COLORS.borderColor }}>
        {players.map((player) => (
         <div key={player._id} className="flex items-center gap-2 py-1">
          <input
           type="checkbox"
           checked={formData.viewableBy.includes(player._id)}
           onChange={() => togglePlayerSelection(player._id, 'viewableBy')}
          />
          <span style={{ color: COLORS.textColor }}>{player.name}</span>
         </div>
        ))}
       </div>
      </div>
     </div>

     {/* Controls */}
     <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: COLORS.borderColor }}>
      <Button variant="outline" onClick={onClose} disabled={loading}>
       Cancel
      </Button>
      <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
       {loading ? (
        <>
         <Clock className="h-4 w-4 mr-2 animate-spin" />
         Saving...
        </>
       ) : (
        <>
         <Save className="h-4 w-4 mr-2" />
         {isEdit ? 'Update' : 'Create'} report
        </>
       )}
      </Button>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
};

export default TeamReportModal; 