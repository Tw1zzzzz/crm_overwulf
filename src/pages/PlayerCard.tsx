import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPlayerCard, updatePlayerContacts, uploadRoadmap, uploadMindmap, createPlayerCard, updateCommunicationLine, getAllPlayerCards, deletePlayerCard, attachPlayerToCard } from "@/utils/api/playerCard";
import { getPlayerDashboard } from "@/utils/api/playerDashboard";
import { getImageUrl } from "@/utils/imageUtils";
import { getPlayers } from "@/lib/api";
import { Loader2, Upload, Send, Image, Search, Plus, UserPlus, CreditCard, MessageSquare, X, ChevronDown, 
 CheckCircle2, AlertCircle, Info, FileImage, Users, FileBarChart, BadgeCheck, Calendar, Activity, BrainCircuit, UserIcon, Layers, Filter, SortAsc, LayoutGrid, Trash, Link, Bug } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BaselineAssessment, User } from "@/types";
import AddPlayerForm from "@/components/AddPlayerForm";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axios from "axios";
import PageIntro from "@/components/PageIntro";

/**
 * SafeImage - компонент для безопасного отображения ofображений с обработкой ошибок
 * @param src - URL images
 * @param alt - альтернативный текст
 * @param className - CSS-классы
 * @param fallback - текст, отображаемый при ошибке загрузки
 */
const SafeImage = ({ src, alt, className, fallback = "Image unavailable" }: { src?: string, alt: string, className?: string, fallback?: string }) => {
 const [error, setError] = useState(false);
 const [loading, setLoading] = useState(true);
 
 // Normalлofуем URL, добавляя параметр для предотвращения кэширования
 const imageUrl = useMemo(() => {
  if (!src) return "";
  // Если URL уже содержит параметры, добавляем timestamp
  const timestamp = Date.now();
  return src.includes('?') ? `${src}&t=${timestamp}` : `${src}?t=${timestamp}`;
 }, [src]);
 
 // Satрасываем состояние ошибки при changении URL
 useEffect(() => {
  setError(false);
  setLoading(true);
 }, [imageUrl]);
 
 if (!src) {
  return (
   <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>
    <FileImage className="h-8 w-8 opacity-50" />
    <span className="ml-2">{fallback}</span>
   </div>
  );
 }
 
 return (
  <div className={`${className} relative overflow-hidden`}>
   {loading && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
     <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
   )}
   {error ? (
    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
     <AlertCircle className="h-8 w-8 mr-2 text-destructive" />
     <span>{fallback}</span>
    </div>
   ) : (
    <img 
     src={imageUrl} 
     alt={alt} 
     className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
     onLoad={() => setLoading(false)}
     onError={(e) => {
      console.error(`Image load error: ${src}`, e);
      setError(true);
      setLoading(false);
     }}
    />
   )}
  </div>
 );
};

/**
 * PlayerCardPage - компонент страницы для управления карточками players
 * 
 * Функциональность:
 * - Просмотр списка всех players
 * - Поиск players по имени и email
 * - Просмотр и редактирование карточек players
 * - Добавление новых players
 * - Loading карт развития (Roadmap и Mindmap)
 * - Управление контактами и коммуникативной линией
 * 
 * Modeы отображения:
 * - Сетка (Grid): список всех players с раскрывающимися карточками
 * - Детальное представление (Detail): детальная информация о выбранном playerе
 * 
 * Обновления в версии 2.0:
 * - Добавлены анимации и вofуальные эффекты
 * -  статистика по карточкам
 * - Улучшенное отображение контактов и профилей
 * - Индикаторы наличия Roadmap и Mindmap
 * - Оптимofирована загрузка данных по требованию при раскрытии карточек
 * 
 * @version 2.0.0
 * @author Team разработки
 */

// Определяем режимы отображения
enum DisplayMode {
 GRID = 'grid',
 DETAIL = 'detail'
}

// Определяем интерфейс для формы контактов
interface ContactsForm {
 vk: string;
 telegram: string;
 faceit: string;
 steam: string;
 nickname: string;
}

// Добавляем стили для анимаций
const animationStyles = `
 @keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
 }
 
 @keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
 }
 
 @keyframes slideIn {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
 }
 
 @keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
 }
 
 @keyframes glow {
  0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.8); }
  100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
 }
 
 .animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
 }
 
 .animate-slideIn {
  animation: slideIn 0.4s ease-out forwards;
 }
 
 .animate-bounce-subtle {
  animation: bounce 2s ease infinite;
 }
 
 .animate-pulse-light {
  animation: pulse 2s infinite;
 }
 
 .animate-glow {
  animation: glow 2.5s infinite;
 }
 
 .player-card-active {
  border-left: 4px solid rgb(99, 102, 241);
  background-color: rgba(99, 102, 241, 0.05);
 }
 
 .player-card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
 }
 
 .card-content-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
 }
 
 .img-hover-zoom {
  overflow: hidden;
 }
 
 .img-hover-zoom img {
  transition: transform 0.5s ease;
 }
 
 .img-hover-zoom:hover img {
  transform: scale(1.05);
 }
 
 .glassmorphism {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
 }
 
 .tab-highlight {
  position: relative;
 }
 
 .tab-highlight::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgb(99, 102, 241);
  transform: scaleX(0);
  transition: transform 0.3s ease;
 }
 
 .tab-highlight:hover::after {
  transform: scaleX(1);
 }
`;

// Typeы для данных карточки player
interface PlayerCardData {
 playerCard: {
  userId: string;
  contacts: {
   vk: string;
   telegram: string;
   faceit: string;
   steam: string;
   nickname: string;
  };
  roadmap: string;
  mindmap: string;
  communicationLine: string;
  updatedAt: string;
 };
 baselineAssessment?: BaselineAssessment | null;
 user: {
  id: string;
  name: string;
  avatar?: string;
 };
}

interface PlayerDashboardData {
 scores: {
  readiness: number | null;
  performance: number | null;
  discipline?: number | null;
  success: number | null;
  confidence: number;
 };
 windows: {
  days7: { readiness: number | null; performance: number | null; discipline?: number | null; success: number | null };
  days30: { readiness: number | null; performance: number | null; discipline?: number | null; success: number | null };
 };
 drivers: { label: string; value: number | null }[];
 timeline: {
  days7: { date: string; readiness: number | null; performance: number | null; discipline?: number | null; success: number | null }[];
  days30: { date: string; readiness: number | null; performance: number | null; discipline?: number | null; success: number | null }[];
 };
}

// Typeы для контактов
interface ContactsForm {
 vk: string;
 telegram: string;
 faceit: string;
 steam: string;
 nickname: string;
}

/**
 * Компонент страницы карточек players
 */
const PlayerCardPage: React.FC = () => {
 const { user } = useAuth();
 const navigate = useNavigate();
 const { playerId } = useParams<{ playerId: string }>();
 
 // Состояния для списка players и выбранного player
 const [players, setPlayers] = useState<User[]>([]);
 const [loadingPlayers, setLoadingPlayers] = useState<boolean>(true);
 const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState<string>("");
 
 // Добавляем состояния для расширенного поиска
 const [advancedSearchQuery, setAdvancedSearchQuery] = useState<string>("");
 const [searchByEmail, setSearchByEmail] = useState<boolean>(true);
 const [searchByName, setSearchByName] = useState<boolean>(true);
 
 // Состояние для активной вкладки
 const [activeTab, setActiveTab] = useState<string>("all-cards");
 
 // Состояние для отслеживания развернутой карточки
 const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
 
 // Состояние для карточек players с загруженными данными
 const [playerCardsData, setPlayerCardsData] = useState<Record<string, PlayerCardData | null>>({});
 
 // Состояния загрузки и данных карточки
 const [loading, setLoading] = useState<boolean>(false);
 const [saving, setSaving] = useState<boolean>(false);
 const [creatingCard, setCreatingCard] = useState<boolean>(false);
 const [uploadingRoadmap, setUploadingRoadmap] = useState<boolean>(false);
 const [uploadingMindmap, setUploadingMindmap] = useState<boolean>(false);
 const [uploadingCommunicationImage, setUploadingCommunicationImage] = useState<boolean>(false);
 const [communicationLineImage, setCommunicationLineImage] = useState<File | null>(null);
 const [playerHasCard, setPlayerHasCard] = useState<boolean>(false);
 const [contacts, setContacts] = useState<ContactsForm>({
  vk: "",
  telegram: "",
  faceit: "",
  steam: "",
  nickname: ""
 });
 
 // Отслеживаем запросы в процессе для предотвращения дублирования
 const pendingRequests = useRef<Record<string, boolean>>({});
 
 // Кэширование времени последнего обновления данных для предотвращения частых запросов
 const lastUpdated = useRef<Record<string, number>>({});
 
 // Константа для определения, насколько старыми должны быть данные, чтобы их обновить (5 минут)
 const CACHE_TIMEOUT = 5 * 60 * 1000;
 
 const [communicationLine, setCommunicationLine] = useState<string>("");
 const [savingCommunicationLine, setSavingCommunicationLine] = useState<boolean>(false);
 
 // Состояние для режима отображения (сетка или детали)
 const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.GRID);
 
 // Состояние для отображения диалога добавления player
 const [showAddPlayerDialog, setShowAddPlayerDialog] = useState<boolean>(false);
 
 // Состояние для диалога подтверждения удаления
 const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
 // Состояние для отслеживания процесса удаления
 const [deleting, setDeleting] = useState(false);
 // ID player, карточку которого нужно удалить
 const [playerToDeleteId, setPlayerToDeleteId] = useState<string>("");
 // Name текущего player для отображения в диалоге
 const [currentPlayerName, setCurrentPlayerName] = useState<string>("");
 
 const [isDialogSubmitting, setIsDialogSubmitting] = useState<boolean>(false);
 
 // Состояние для нового player в диалоге добавления
 const [newPlayerData, setNewPlayerData] = useState({
  name: "",
  contacts: {
   nickname: "",
   vk: "",
   telegram: "",
   faceit: "",
   steam: ""
  },
  communicationLine: ""
 });
 
 // Refs для загрузки файлов
 const roadmapFileRef = useRef<HTMLInputElement>(null);
 const mindmapFileRef = useRef<HTMLInputElement>(null);
 const dialogRoadmapRef = useRef<HTMLInputElement>(null);
 const dialogMindmapRef = useRef<HTMLInputElement>(null);
 const communicationLineImageRef = useRef<HTMLInputElement>(null); // Link на инпут для загрузки images в коммуникативную линию
 
 // Состояние для файлов в диалоге добавления
 const [dialogRoadmapFile, setDialogRoadmapFile] = useState<File | null>(null);
 const [dialogMindmapFile, setDialogMindmapFile] = useState<File | null>(null);
 
 // Добавляем новые состояния для статистики
 const [statsLoading, setStatsLoading] = useState<boolean>(false);
 const [cardsStats, setCardsStats] = useState({
  total: 0,
  withRoadmap: 0,
  withMindmap: 0,
  withCommunicationLine: 0,
  lastUpdated: ''
 });
 
 // Состояния для дашборда player (v1)
 const [dashboardData, setDashboardData] = useState<PlayerDashboardData | null>(null);
 const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
 const [dashboardError, setDashboardError] = useState<string | null>(null);
 const isSoloPlayer = user?.role === "player" && user?.playerType === "solo";
 
 // Функция сброса всех состояний для нового player
 const resetAllPlayerStates = () => {
  // Satрасываем данные для формы нового player
  setNewPlayerData({
   name: "",
   contacts: {
    nickname: "",
    vk: "",
    telegram: "",
    faceit: "",
    steam: ""
   },
   communicationLine: ""
  });
  
  // Satрасываем файлы
  setDialogRoadmapFile(null);
  setDialogMindmapFile(null);
  
  // Важно: сбрасываем глобальные состояния контактов и коммуникативной линии
  setContacts({
   vk: "",
   telegram: "",
   faceit: "",
   steam: "",
   nickname: ""
  });
  setCommunicationLine("");
  
  // Satрасываем флаги загрузки
  setUploadingRoadmap(false);
  setUploadingMindmap(false);
  setSaving(false);
  setSavingCommunicationLine(false);
  
  // Очищаем инпуты файлов
  if (roadmapFileRef.current) roadmapFileRef.current.value = "";
  if (mindmapFileRef.current) mindmapFileRef.current.value = "";
  if (dialogRoadmapRef.current) dialogRoadmapRef.current.value = "";
  if (dialogMindmapRef.current) dialogMindmapRef.current.value = "";
  
  // Важно: сбрасываем выбранного player перед созданием нового
  setSelectedPlayerId(null);
 };
 
 // Состояние для отслеживания прогресса загрузки
 const [loadingProgress, setLoadingProgress] = useState<number>(0);
 
 // Состояние для принудительного обновления списка players
 const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
 
 // Состояния для диалога привязки player к карточке
 const [showAttachPlayerDialog, setShowAttachPlayerDialog] = useState(false);
 const [attachingPlayer, setAttachingPlayer] = useState(false);
 const [loadingAttachDialog, setLoadingAttachDialog] = useState(false);
 const [selectedCardForAttach, setSelectedCardForAttach] = useState("");
 const [selectedPlayerForAttach, setSelectedPlayerForAttach] = useState("");
 const [availableCards, setAvailableCards] = useState<any[]>([]);
 const [availablePlayersForAttach, setAvailablePlayersForAttach] = useState<any[]>([]);
 
 // Функция принудительного обновления компонента с опциональной задержкой
 const forceUpdate = useCallback((delay?: number) => {
  if (delay) {
   // Если указана задержка, используем setTimeout
   setTimeout(() => {
    setForceUpdateCounter(prev => prev + 1);
   }, delay);
  } else {
   // Иначе обновляем сразу
   setForceUpdateCounter(prev => prev + 1);
  }
 }, []);
 
 // Функция для обновления прогресса загрузки
 const updateLoadingProgress = useCallback((current: number, total: number) => {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  setLoadingProgress(progress);
 }, []);
 
 const formatScore = (value?: number | null) => {
  return typeof value === 'number' ? Math.round(value) : '—';
 };
 
 // Loading всех карточек players при инициалofации страницы
 useEffect(() => {
  const loadAllPlayerCards = async () => {
   try {
    // Loading всех карточек с сервера
    setLoadingProgress(10);
    const result = await getAllPlayerCards();
    setLoadingProgress(50);
    
    if (result.success && result.data && result.data.data) {
     // Получаем данные карточек с сервера
     const cards = result.data.data;
     const playerCardsObj: Record<string, PlayerCardData | null> = {};
     
           // Создаем объект с карточками по идентификатору user
      cards.forEach(card => {
       if (card && card.userId) {
        // Используем как userId, так и user.id для гарантии связи с playerми
        playerCardsObj[card.userId] = {
         playerCard: card,
         user: card.user || { id: card.userId, name: 'Unknown player', avatar: '' }
        };
        
        // Если есть информация о пользователе, создаем еще один ключ
        if (card.user && card.user.id) {
         playerCardsObj[card.user.id] = {
          playerCard: card,
          user: card.user
         };
        }
      }
     });
     
     // Обновляем состояние карточек
     setPlayerCardsData(prevData => ({
      ...prevData,
      ...playerCardsObj
     }));
     
     // Дополнительно обновляем список players, если необходимо
     setPlayers(prevPlayers => {
      // Создаем карту текущих players для быстрого поиска
      const existingPlayersMap = new Map();
      prevPlayers.forEach(p => {
       const playerId = p.id || p._id;
       if (playerId) {
        existingPlayersMap.set(playerId, p);
       }
      });
      
      // Добавляем новых players of карточек
      cards.forEach(card => {
       if (card.user && card.user.id) {
        const userId = card.user.id;
        // Если player еще нет в списке
        if (!existingPlayersMap.has(userId)) {
         existingPlayersMap.set(userId, {
          id: userId,
          name: card.user.name || 'Unnamed',
          role: 'player',
          avatar: card.user.avatar || ''
         });
        }
       }
      });
      
      // Преобразуем карту обратно в массив
      return Array.from(existingPlayersMap.values());
     });
     
     console.log(`Loaded ${cards.length} карточек players`);
     setLoadingProgress(100);
    } else {
     console.warn('Failed to load player cards:', result.error);
    }
   } catch (error) {
    console.error('Error while loading player cards:', error);
   } finally {
    // Satрасываем прогресс загрузки
    setTimeout(() => {
     setLoadingProgress(0);
    }, 300);
   }
  };
  
  // Запускаем загрузку карточек
  loadAllPlayerCards();
 }, [forceUpdateCounter]); // Зависимость от forceUpdateCounter позволяет принудительно обновлять карточки
 
 // Loading дашборда player при выборе
 useEffect(() => {
  const loadDashboard = async () => {
   if (!selectedPlayerId) {
    setDashboardData(null);
    setDashboardError(null);
    return;
   }
   
   setDashboardLoading(true);
   setDashboardError(null);
   
   const result = await getPlayerDashboard(selectedPlayerId);
   if (result.success) {
    setDashboardData(result.data);
   } else {
    const isDashboardAccessDenied =
     result.error?.trim() === "You do not have permission for this action";

    setDashboardData(null);

    // Для solo-player скрываем системное сообщение 403 в "My card".
    setDashboardError(
     isSoloPlayer && isDashboardAccessDenied
      ? null
      : result.error || 'Failed to load dashboard'
    );
   }
   
   setDashboardLoading(false);
  };
  
  loadDashboard();
 }, [selectedPlayerId, forceUpdateCounter, isSoloPlayer]);
 
 // Обработчик changes полей ввода в диалоге добавления player
 const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  
  if (name.includes('.')) {
   const [section, field] = name.split('.');
   setNewPlayerData(prev => ({
    ...prev,
    [section]: {
     ...prev[section as keyof typeof prev] as Record<string, string>,
     [field]: value
    }
   }));
  } else {
   setNewPlayerData(prev => ({
    ...prev,
    [name]: value
   }));
  }
 };
 
 // Обработчик changes коммуникативной линии в диалоге
 const handleDialogCommunicationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setNewPlayerData(prev => ({
   ...prev,
   communicationLine: e.target.value
  }));
 };
 
 // Обработчик загрузки Roadmap в диалоге
 const handleDialogRoadmapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   // Проверка размера файла (не более 5 МБ)
   if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must not exceed 5 MB");
    if (dialogRoadmapRef.current) {
     dialogRoadmapRef.current.value = "";
    }
    return;
   }
   
   // Проверка типа файла
   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
    toast.error("Only .jpg, .jpeg, .png, and .webp images are allowed");
    if (dialogRoadmapRef.current) {
     dialogRoadmapRef.current.value = "";
    }
    return;
   }
   
   setDialogRoadmapFile(file);
  }
 };
 
 // Обработчик загрузки images для коммуникативной линии
 const handleCommunicationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   // Проверка размера файла (не более 5 МБ)
   if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must not exceed 5 MB");
    if (communicationLineImageRef.current) {
     communicationLineImageRef.current.value = "";
    }
    return;
   }
   
   // Проверка типа файла
   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
    toast.error("Only .jpg, .jpeg, .png, and .webp images are allowed");
    if (communicationLineImageRef.current) {
     communicationLineImageRef.current.value = "";
    }
    return;
   }
   
   setCommunicationLineImage(file);
   toast.success("Communication line image selected");
  }
 };
 
 // Обработчик загрузки Mindmap в диалоге
 const handleDialogMindmapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   // Проверка размера файла (не более 5 МБ)
   if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must not exceed 5 MB");
    if (dialogMindmapRef.current) {
     dialogMindmapRef.current.value = "";
    }
    return;
   }
   
   // Проверка типа файла
   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
    toast.error("Only .jpg, .jpeg, .png, and .webp images are allowed");
    if (dialogMindmapRef.current) {
     dialogMindmapRef.current.value = "";
    }
    return;
   }
   
   setDialogMindmapFile(file);
  }
 };
 
 // Функция для открытия диалога выбора файла
 const handleDialogFileClick = (type: 'roadmap' | 'mindmap') => {
  if (type === 'roadmap' && dialogRoadmapRef.current) {
   dialogRoadmapRef.current.click();
  } else if (type === 'mindmap' && dialogMindmapRef.current) {
   dialogMindmapRef.current.click();
  }
 };

 // Обработчик создания карточки для выбранного player
 const handlePlayerAdded = async () => {
  if (!selectedPlayerId) {
   toast.error("Choose a player to create a card");
   return;
  }
  
  try {
   setIsDialogSubmitting(true);
   
   // Получаем токен
   const token = localStorage.getItem('token');
   if (!token) {
    throw new Error('Authorization required');
   }
   
   const baseUrl = '';
   
   toast.loading("Creating player card...");
   
   // Создаем карточку для выбранного player
   let cardResponse;
   try {
    cardResponse = await axios.post(
     `${baseUrl}/api/player-cards`,
     { userId: selectedPlayerId },
     {
      headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
      }
     }
    );
   } catch (cardError: any) {
    console.error("Player card creation error details:", {
     status: cardError.response?.status,
     statusText: cardError.response?.statusText,
     data: cardError.response?.data,
     message: cardError.message
    });
    
    const errorMsg = cardError.response?.data?.message || 
            cardError.message || 
            "Failed to create player card";
            
    toast.error(`Error: ${errorMsg}`);
    setIsDialogSubmitting(false);
    return;
   }
   
   if (!cardResponse.data) {
    console.error("Invalid server response while creating player card:", cardResponse);
    throw new Error("Failed to create player card: invalid server response");
   }
   
   toast.loading("Updating contacts...", { id: "contacts-update" });
   
   // Обновляем контакты player
   await axios.put(
    `${baseUrl}/api/player-cards/${selectedPlayerId}/contacts`,
    { contacts: newPlayerData.contacts },
    {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
     }
    }
   );
   
   // Обновляем коммуникативную линию, если она указана
   if (newPlayerData.communicationLine) {
    await axios.put(
     `${baseUrl}/api/player-cards/${selectedPlayerId}/communication-line`,
     { communicationLine: newPlayerData.communicationLine },
     {
      headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
      }
     }
    );
   }
   
   // Загружаем файлы, если они выбраны
   const uploadTasks = [];
   let roadmapUrl = '';
   let mindmapUrl = '';
   
   if (dialogRoadmapFile) {
    toast.loading("Uploading Roadmap file...", { id: "roadmap-upload" });
    const formData = new FormData();
    formData.append('roadmap', dialogRoadmapFile);
    const uploadPromise = axios.post(
     `${baseUrl}/api/player-cards/${selectedPlayerId}/roadmap`,
     formData,
     {
      headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'multipart/form-data'
      }
     }
    ).then(res => {
     if (res.data && res.data.roadmap) {
      roadmapUrl = res.data.roadmap;
     }
     return res;
    });
    
    uploadTasks.push(uploadPromise);
   }
   
   if (dialogMindmapFile) {
    toast.loading("Uploading Mindmap file...", { id: "mindmap-upload" });
    const formData = new FormData();
    formData.append('mindmap', dialogMindmapFile);
    const uploadPromise = axios.post(
     `${baseUrl}/api/player-cards/${selectedPlayerId}/mindmap`,
     formData,
     {
      headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'multipart/form-data'
      }
     }
    ).then(res => {
     if (res.data && res.data.mindmap) {
      mindmapUrl = res.data.mindmap;
     }
     return res;
    });
    
    uploadTasks.push(uploadPromise);
   }
   
   // Выполняем загрузку файлов параллельно, если они есть
   if (uploadTasks.length > 0) {
    try {
     await Promise.all(uploadTasks);
    } catch (e) {
     console.error("File upload error:", e);
     toast.error("Some maps could not be uploaded. You can add them later.");
    }
   }
   
   toast.dismiss();
   toast.success("Player card created successfully");
   
   // Скрываем диалог добавления player
   setShowAddPlayerDialog(false);
   
   // Satрасываем форму
   setNewPlayerData({
    name: '',
    contacts: { vk: '', telegram: '', faceit: '', steam: '', nickname: '' },
    communicationLine: ''
   });
   setSelectedPlayerId('');
   
   // Перезагружаем страницу для обновления данных
   window.location.reload();
  } catch (error: any) {
   toast.dismiss();
   console.error("Failed to create player:", error);
   
   const errorMessage = error.response?.data?.message || "Unknown error while creating player";
   toast.error(`Error: ${errorMessage}`);
  } finally {
   setIsDialogSubmitting(false);
  }
 };
 
 // Обновленная функция загрузки players с индикацией прогресса
 const fetchPlayers = async () => {
  try {
   setLoadingPlayers(true);
   setLoadingProgress(10); // Начальный прогресс
   
   const result = await getPlayers();
   setLoadingProgress(50); // Progress после получения данных
   
   if (result.data && Array.isArray(result.data)) {
    // Normalлofация данных players для предотвращения проблем с ID
    const normalizedPlayers = result.data
     .filter(p => p && (p._id || p.id) && p.role === "player")
     .map(p => {
      // Убедимся, что у всех players есть корректный ID
      const id = (p as any)._id || p.id;
      return {
       id: id,
      name: p.name || "Unknown",
      email: p.email || "",
      role: p.role
      };
     });
    
    // Проверка на наличие дубликатов ID
    const idSet = new Set<string>();
    const uniquePlayers = normalizedPlayers.filter(player => {
     if (idSet.has(player.id)) {
      console.warn(`Duplicate player ID detected: ${player.id}`);
      return false;
     }
     idSet.add(player.id);
     return true;
    });
    
    setLoadingProgress(80); // Progress после обработки данных
    setPlayers(uniquePlayers);
    
    // Логирование для отладки
    console.log(`Loaded ${uniquePlayers.length} players`);
   } else {
    console.error("Invalid player data format:", result.data);
    toast.error("Failed to load player list: invalid data format");
    setPlayers([]);
   }
   
   setLoadingProgress(100); // Финальный прогресс
  } catch (error) {
   console.error("Failed to load player list:", error);
   toast.error("Failed to load player list");
   setPlayers([]);
  } finally {
   // Небольшая задержка перед сбросом индикаторов загрузки, чтобы пользователь увидел 100%
   setTimeout(() => {
   setLoadingPlayers(false);
    setLoadingProgress(0);
   }, 300);
  }
 };
 
 // Loading списка players при монтировании компонента
 useEffect(() => {
  if (user && user.role === "staff") {
   // Staff: загружаем всех players
   fetchPlayers();
  } else if (user && isSoloPlayer) {
   // Solo-player: сразу показываем свою карточку без загрузки общего списка
   setSelectedPlayerId(user.id || null);
   setDisplayMode(DisplayMode.DETAIL);
   setLoadingPlayers(false);
  } else {
   navigate("/dashboard");
   toast.error("Access denied. Staff and solo players only.");
  }
 }, [user, navigate, isSoloPlayer]);
 
 // Create player card
 const handleCreatePlayerCard = async () => {
  if (!selectedPlayerId) return;
  
  try {
   setCreatingCard(true);
   
   // Проверяем, не выполняется ли уже запрос
   if (pendingRequests.current[selectedPlayerId]) {
    toast.info("Request already in progress, please wait");
    return;
   }
   
   pendingRequests.current[selectedPlayerId] = true;
   
   // Вызываем API для создания карточки
   const result = await createPlayerCard(selectedPlayerId);
   
   if (result.success && result.data) {
    toast.success("Player card created successfully");
    
    // Обновляем данные в состоянии
    setPlayerCardsData(prev => ({
     ...prev,
     [selectedPlayerId]: result.data
    }));
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[selectedPlayerId] = Date.now();
    
    setPlayerHasCard(true);
    setContacts({
     vk: result.data.playerCard.contacts.vk || "",
     telegram: result.data.playerCard.contacts.telegram || "",
     faceit: result.data.playerCard.contacts.faceit || "",
     steam: result.data.playerCard.contacts.steam || "",
     nickname: result.data.playerCard.contacts.nickname || ""
    });
    setCommunicationLine(result.data.playerCard.communicationLine || "");
   } else {
    const errorMsg = result.error || "Failed to create player card";
    toast.error(errorMsg);
    
    // Обновляем состояние для отображения ошибки
    setPlayerCardsData(prev => ({
     ...prev,
     [selectedPlayerId]: null
    }));
    setPlayerHasCard(false);
   }
  } catch (error) {
   console.error("Failed to create player card:", error);
   toast.error("Failed to create player card");
   
   // Обновляем состояние для отображения ошибки
   setPlayerCardsData(prev => ({
    ...prev,
    [selectedPlayerId]: null
   }));
   setPlayerHasCard(false);
  } finally {
   pendingRequests.current[selectedPlayerId] = false;
   setCreatingCard(false);
  }
 };
 
 // Улучшенная функция загрузки данных карточки player с предотвращением гонки состояний
 const fetchPlayerCard = useCallback(async (userId: string, forceRefresh = false) => {
  // Если запрос уже выполняется, не дублируем
  if (pendingRequests.current[userId]) {
   return;
  }
  
  // Если данные уже загружены и не превысили CACHE_TIMEOUT, не загружаем повторно
  // если только not specified флаг forceRefresh
  const now = Date.now();
  if (
   !forceRefresh && 
   playerCardsData[userId] !== undefined && 
   lastUpdated.current[userId] && 
   (now - lastUpdated.current[userId]) < CACHE_TIMEOUT
  ) {
   return;
  }
  
  try {
   pendingRequests.current[userId] = true;
   
   // Если загружаем для текущего выбранного player, показываем индикатор загрузки
   if (userId === selectedPlayerId) {
    setLoading(true);
   }
   
   // Помечаем, что карточка загружается (устанавливаем undefined)
   setPlayerCardsData(prev => ({
    ...prev,
    [userId]: undefined
   }));
   
   const result = await getPlayerCard(userId);
   
   // Обновляем время последнего обновления
   lastUpdated.current[userId] = Date.now();
    
    // Если карточка найдена
    if (result.success && result.data) {
     setPlayerCardsData(prev => ({
      ...prev,
     [userId]: result.data
     }));
    
    // Если это выбранный player, обновляем локальные состояния
    if (userId === selectedPlayerId) {
     setPlayerHasCard(true);
     
     // Синхронofируем локальные состояния с данными карточки
     setContacts({
      vk: result.data.playerCard.contacts.vk || "",
      telegram: result.data.playerCard.contacts.telegram || "",
      faceit: result.data.playerCard.contacts.faceit || "",
      steam: result.data.playerCard.contacts.steam || "",
      nickname: result.data.playerCard.contacts.nickname || ""
     });
     setCommunicationLine(result.data.playerCard.communicationLine || "");
    }
    } 
    // Если карточки нет
    else {
     setPlayerCardsData(prev => ({
      ...prev,
     [userId]: null
     }));
    
    // Если это выбранный player, обновляем локальные состояния
    if (userId === selectedPlayerId) {
     setPlayerHasCard(false);
     
     // Очищаем локальные состояния
     setContacts({
      vk: "",
      telegram: "",
      faceit: "",
      steam: "",
      nickname: ""
     });
     setCommunicationLine("");
    }
    }
   } catch (error) {
    console.error("Failed to load player card:", error);
   
   // Показываем ошибку только если это выбранный player
   if (userId === selectedPlayerId) {
    toast.error("Failed to load player card");
   }
    
    setPlayerCardsData(prev => ({
     ...prev,
    [userId]: null
   }));
   
   if (userId === selectedPlayerId) {
    setPlayerHasCard(false);
    setContacts({
     vk: "",
     telegram: "",
     faceit: "",
     steam: "",
     nickname: ""
    });
    setCommunicationLine("");
   }
   } finally {
   // Снимаем флаг загрузки
   pendingRequests.current[userId] = false;
   
   // Снимаем индикатор загрузки только для выбранного player
   if (userId === selectedPlayerId) {
    setLoading(false);
   }
  }
 }, [selectedPlayerId, playerCardsData]);
 
 // Loading данных карточки player при выборе player
 useEffect(() => {
  if (!selectedPlayerId) return;
  
  fetchPlayerCard(selectedPlayerId);
 }, [selectedPlayerId, fetchPlayerCard]);

 // Автоматический выбор player of URL при загрузке страницы
 useEffect(() => {
  if (playerId && players.length > 0 && !selectedPlayerId) {
   // Проверяем, существует ли player с таким ID
   const playerExists = players.some(player => player.id === playerId);
   if (playerExists) {
    setSelectedPlayerId(playerId);
    setDisplayMode(DisplayMode.DETAIL);
    console.log(`Automatically selected player from URL: ${playerId}`);
   } else {
    console.warn(`Player с ID ${playerId} не найден в списке`);
    toast.error("Player not found. Showing all players.");
    // Остаемся на текущей странице в режиме сетки
    setDisplayMode(DisplayMode.GRID);
   }
  }
 }, [playerId, players, selectedPlayerId]);
 
 // Обработчик changes выбранного player
 const handlePlayerChange = (value: string) => {
  setSelectedPlayerId(value);
  setDisplayMode(DisplayMode.DETAIL);
 };

 /**
 * Универсальная функция для удаления карточки player
 * @param userId ID user для удаления
 * @param playerName Name player для отображения в уведомлениях
 * @param playerId ID player в локальном состоянии
 * @param callback Опциональный колбэк после успешного удаления
 */
const safeDeletePlayerCard = async (
 userId: string, 
 playerName: string, 
 playerId: string,
 callback?: () => void
) => {
 try {
  if (!userId) {
   toast.error('Cannot delete card: user ID is missing');
   return false;
  }
  
  console.log(`Starting card deletion with userId: ${userId}, playerId: ${playerId}`);
  
  // Показываем тост с информацией о начале удаления
  toast.info(`Deleting card ${playerName}...`);
  
  // Устанавливаем флаг отмены операции при длительном выполнении
  let canceled = false;
  const timeoutId = setTimeout(() => {
   canceled = true;
   toast.error('Request timed out. Please try again.');
  }, 10000);
  
  // Вызываем API для удаления
  const result = await deletePlayerCard(userId);
  
  // Останавливаем таймер
  clearTimeout(timeoutId);
  
  // Если операция была отменена по таймауту, прекращаем выполнение
  if (canceled) {
   return false;
  }
  
  if (result.success) {
   // Показываем уведомление об успехе
   toast.success(`Player card ${playerName} успешно удалена`);
   
   console.log(`Successе удаление карточки, начинаем обновление UI для playerId: ${playerId}`);
   
   // Правильно обновляем состояние компонента - устанавливаем null вместо удаления ключа
   setPlayerCardsData(prev => {
    const newState = { ...prev };
    if (playerId && newState[playerId]) {
     // Важное changение: вместо удаления ключа устанавливаем null
     newState[playerId] = null;
     console.log(`Card с ID ${playerId} помечена как null в состоянии`);
    } else {
     console.log(`Card with ID not found ${playerId} в текущем состоянии`); 
    }
    return newState;
   });
   
   // Satрасываем состояние загрузки для ofбежания зависшей анимации
   if (playerId === selectedPlayerId) {
    setLoading(false);
   }
   
   // Обновляем данные на странице с небольшой задержкой для корректного обновления UI
   setTimeout(() => {
    setForceUpdateCounter(prev => prev + 1);
    console.log('Component force refresh completed');
   }, 100);
   
   // Выполняем колбэк, если он есть
   if (callback) callback();
   
   return true;
  } else {
   // Показываем ошибку при удалении
   toast.error(result.error || 'Failed to delete card');
   return false;
  }
 } catch (error) {
  console.error('Critical error while deleting card:', error);
  toast.error('An unexpected error occurred while deleting the card');
  return false;
 }
};

 // Показ диалога подтверждения удаления - не используется в новом подходе
 const showDeleteConfirmation = (playerId: string) => {
  // Получаем данные карточки
  const playerCardData = playerCardsData[playerId];
  
  // Если карточка не найдена
  if (!playerCardData || !playerCardData.playerCard) {
   toast.error('Player card not found');
   return;
  }
  
  // Берём userId напрямую of карточки
  const userId = playerCardData.playerCard.userId;
  
  if (!userId) {
   toast.error('Failed to get card ID');
   return;
  }
  
  // Запоминаем userId of карточки для удаления
  setPlayerToDeleteId(userId);
  
  console.log(`Подготовка к удалению карточки: playerId=${playerId}, userId=${userId}`);
  
  setShowDeleteConfirmDialog(true);
 };

 // Обработчик удаления карточки player
 const handleDeletePlayerCard = async () => {
  if (!playerToDeleteId) {
   toast.error('Failed to delete card: ID is missing');
   return;
  }
  
  setDeleting(true);
  try {
   // Получаем все идентификаторы карточек перед удалением
   const allCardIds = Object.entries(playerCardsData)
    .filter(([_, cardData]) => 
     cardData?.playerCard?.userId === playerToDeleteId)
    .map(([id]) => id);

   console.log('Card IDs to delete:', allCardIds);
   
   // Напрямую удаляем карточку по userId
   const result = await deletePlayerCard(playerToDeleteId);
   
   if (result.success) {
    // Правильно обновляем состояние, чтобы карточка исчезла of UI
    setPlayerCardsData(prev => {
     const newState = { ...prev };
     // Помечаем карточки как null, чтобы они правильно обрабатывались в UI
     allCardIds.forEach(id => {
      newState[id] = null;
     });
     return newState;
    });
    
    // Если удаляем текущую выбранную карточку
    if (playerToDeleteId === selectedPlayerId) {
     // Очищаем формы
     setContacts({
      vk: "",
      telegram: "",
      faceit: "",
      steam: "",
      nickname: ""
     });
     setCommunicationLine("");
     
     // Satрасываем флаг наличия карточки
     setPlayerHasCard(false);
     
     // Принудительно сбрасываем все состояния загрузки
     setLoading(false);
     
     // Возвращаемся к списку players
     setDisplayMode(DisplayMode.GRID);
     setSelectedPlayerId("");
    }
    
    // Показываем уведомление об успехе
    toast.success("Player card deleted successfully");
    
    // Обновляем данные на странице с небольшой задержкой для корректного обновления UI
    setTimeout(() => {
     setForceUpdateCounter(prev => prev + 1);
    }, 100);
   } else {
    toast.error(result.error || "Failed to delete player card");
   }
  } catch (error) {
   console.error("Failed to delete player card:", error);
   toast.error("An error occurred while deleting the card");
  } finally {
   setDeleting(false);
   setShowDeleteConfirmDialog(false);
   setPlayerToDeleteId("");
  }
 };
 
 // Фильтрация players по поисковому запросу для простого поиска с дополнительным 
 // поиском по контактам (если контакты уже загружены)
 const filteredPlayers = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();
  // Проверяем, есть ли вообще playerи
  if (!players || players.length === 0) return [];
  
  // Создаем глубокую копию для защиты от мутаций
  const visiblePlayers = JSON.parse(JSON.stringify(players));
  
  // Если нет поискового запроса, возвращаем всех players
  if (!query) return visiblePlayers;
  
  return visiblePlayers.filter(player => {
   // Проверка на валидность объекта player
   if (!player || !player.id) return false;
   
   const nameMatch = player.name?.toLowerCase()?.includes(query) || false;
   const emailMatch = player.email?.toLowerCase()?.includes(query) || false;
   
   // Базовое совпадение по имени или email
   if (nameMatch || emailMatch) return true;
   
   // Если у нас есть загруженные данные карточки, проверяем контакты
   const playerCard = playerCardsData[player.id];
   if (playerCard && playerCard.playerCard && playerCard.playerCard.contacts) {
    const contacts = playerCard.playerCard.contacts;
    
    // Проверяем каждый контакт на совпадение
    return (
     (contacts.nickname && contacts.nickname.toLowerCase().includes(query)) ||
     (contacts.vk && contacts.vk.toLowerCase().includes(query)) ||
     (contacts.telegram && contacts.telegram.toLowerCase().includes(query)) ||
     (contacts.faceit && contacts.faceit.toLowerCase().includes(query)) ||
     (contacts.steam && contacts.steam.toLowerCase().includes(query))
    );
   }
   
   return false;
  });
 // Добавляем зависимость от forceUpdateCounter для гарантированного обновления при принудительном ререндере
 }, [players, playerCardsData, searchQuery, forceUpdateCounter]);
 
 // Фильтрация players для расширенного поиска
 const advancedFilteredPlayers = useMemo(() => {
  if (advancedSearchQuery.trim() === "") return [];
  
  const query = advancedSearchQuery.toLowerCase();
  
  return players.filter(player => {
  const matchesName = searchByName && player.name.toLowerCase().includes(query);
  const matchesEmail = searchByEmail && player.email.toLowerCase().includes(query);
  
   // Базовое совпадение по имени или email в зависимости от выбранных опций
   if (matchesName || matchesEmail) return true;
   
   // Если у нас есть загруженные данные карточки, проверяем контакты
   const playerCard = playerCardsData[player.id];
   if (playerCard && playerCard.playerCard) {
    const contacts = playerCard.playerCard.contacts;
    
    // Проверяем каждый контакт на совпадение
    return (
     (contacts.nickname && contacts.nickname.toLowerCase().includes(query)) ||
     (contacts.vk && contacts.vk.toLowerCase().includes(query)) ||
     (contacts.telegram && contacts.telegram.toLowerCase().includes(query)) ||
     (contacts.faceit && contacts.faceit.toLowerCase().includes(query)) ||
     (contacts.steam && contacts.steam.toLowerCase().includes(query))
    );
   }
   
   return false;
  });
 }, [players, playerCardsData, advancedSearchQuery, searchByName, searchByEmail]);
 
 // Обработчик changes контактов
 const handleContactsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setContacts(prev => ({
   ...prev,
   [name]: value
  }));
 };
 
 // Обработчик changes коммуникативной линии
 const handleCommunicationLineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setCommunicationLine(e.target.value);
 };
 
 // Обработчик сохранения контактов
 const handleSaveContacts = async () => {
  if (!selectedPlayerId) return;
  
  try {
   setSaving(true);
    
   // Создаем копию текущих данных для оптимистичного обновления UI
   const previousData = playerCardsData[selectedPlayerId];
   
   // Оптимистично обновляем UI
    if (playerCardsData[selectedPlayerId]) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: {
       ...prev[selectedPlayerId],
       playerCard: {
        ...prev[selectedPlayerId].playerCard,
        contacts: {
         ...contacts
        }
       }
      }
     }));
    }
   
   const result = await updatePlayerContacts(contacts, selectedPlayerId);
   
   if (result.success) {
    toast.success("Contacts updated successfully");
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[selectedPlayerId] = Date.now();
    await fetchPlayerCard(selectedPlayerId, true);
   } else {
    // В случае ошибки возвращаем предыдущее состояние
    toast.error(result.error || "Failed to update contacts");
    
    if (previousData) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: previousData
     }));
    }
   }
  } catch (error) {
   console.error("Failed to save contacts:", error);
   toast.error("Failed to save contacts");
  } finally {
   setSaving(false);
  }
 };
 
 // Loading images для коммуникативной линии
 const handleUploadCommunicationImage = async () => {
  if (!selectedPlayerId || !communicationLineImage) return;
  
  try {
   setUploadingCommunicationImage(true);
   
   // Формируем FormData для загрузки файла
   const formData = new FormData();
   formData.append('communicationImage', communicationLineImage);
   
   // Получаем токен аутентификации
   const token = localStorage.getItem('token');
   if (!token) {
    throw new Error('Authorization required');
   }
   
   // Создаем аналогичный URL как для загрузки других ofображений
   const baseUrl = '';
   const url = `${baseUrl}/api/player-cards/${selectedPlayerId}/communication-image`;
   
   // Отправляем запрос на загрузку
   const response = await axios.post(url, formData, {
    headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'multipart/form-data'
    }
   });
   
   if (response.status >= 200 && response.status < 300) {
    toast.success('Communication line image uploaded successfully');
    
    // Обновляем данные карточки
    await fetchPlayerCard(selectedPlayerId, true);
    
    // Очищаем инпут
    if (communicationLineImageRef.current) {
     communicationLineImageRef.current.value = '';
    }
    setCommunicationLineImage(null);
   } else {
    toast.error('Failed to upload image');
   }
  } catch (error) {
   console.error('Failed to upload communication line image:', error);
   toast.error('An error occurred while uploading the image');
  } finally {
   setUploadingCommunicationImage(false);
  }
 };
 
 // Сохранение коммуникативной линии
 const handleSaveCommunicationLine = async () => {
  if (!selectedPlayerId) return;
  
  try {
   setSavingCommunicationLine(true);
    
   // Создаем копию текущих данных для оптимистичного обновления UI
   const previousData = playerCardsData[selectedPlayerId];
   
   // Оптимистично обновляем UI
    if (playerCardsData[selectedPlayerId]) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: {
       ...prev[selectedPlayerId],
       playerCard: {
        ...prev[selectedPlayerId].playerCard,
        communicationLine: communicationLine
       }
      }
     }));
    }
   
   const result = await updateCommunicationLine(communicationLine, selectedPlayerId);
   
   if (result.success) {
    toast.success("Communication line updated successfully");
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[selectedPlayerId] = Date.now();
   } else {
    // В случае ошибки возвращаем предыдущее состояние
    toast.error(result.error || "Failed to update communication line");
    
    if (previousData) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: previousData
     }));
    }
   }
  } catch (error) {
   console.error("Failed to save communication line:", error);
   toast.error("Failed to save communication line");
  } finally {
   setSavingCommunicationLine(false);
  }
 };
 
 // Открытие детальной информации об playerе
 const handleViewPlayerDetails = async (playerId: string) => {
  // Добавляем логирование для отладки
  console.log(`Switching to player edit mode ${playerId}`);
  
  // Сначала загрузим данные, а только потом переключим режим
  setLoading(true);
  
  try {
   // Принудительно загружаем свежие данные с сервера
   const token = localStorage.getItem('token');
   if (!token) {
    throw new Error('Authorization required');
   }
   
   // Загружаем данные напрямую с сервера
   const baseUrl = '';
   
   const response = await axios.get(`${baseUrl}/api/player-cards/${playerId}`, {
    headers: {
     Authorization: `Bearer ${token}`
    }
   });
   
   console.log('Received API response:', response.data);
   
   if (response.data) {
    // Обновляем данные в состоянии
    setPlayerCardsData(prev => ({
     ...prev,
     [playerId]: response.data
    }));
    
    // Обновляем состояние контактов
    if (response.data.playerCard?.contacts) {
     setContacts({
      vk: response.data.playerCard.contacts.vk || "",
      telegram: response.data.playerCard.contacts.telegram || "",
      faceit: response.data.playerCard.contacts.faceit || "",
      steam: response.data.playerCard.contacts.steam || "",
      nickname: response.data.playerCard.contacts.nickname || ""
     });
    }
    
    // Обновляем коммуникативную линию
    setCommunicationLine(response.data.playerCard?.communicationLine || "");
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[playerId] = Date.now();
    
    // После успешной загрузки данных переключаем режим
    setSelectedPlayerId(playerId);
    setDisplayMode(DisplayMode.DETAIL);
   } else {
    toast.error('Failed to load player data');
   }
  } catch (error) {
   console.error('Failed to load player details:', error);
   toast.error('Failed to load player details');
  } finally {
   setLoading(false);
  }
 };
 
 // Возврат к сетке players
 const handleBackToGrid = () => {
  setDisplayMode(DisplayMode.GRID);
  setSelectedPlayerId(null);
 };
 
 // Обработчик раскрытия/сворачивания карточки
 const handleToggleCard = async (playerId: string) => {
  if (expandedCardId === playerId) {
   setExpandedCardId(null);
   return;
  }
  
  setExpandedCardId(playerId);
  
  try {
   // Проверяем, есть ли уже данные в кэше
   if (
    playerCardsData[playerId] === undefined || 
    playerCardsData[playerId] === null ||
    !lastUpdated.current[playerId] || 
    Date.now() - lastUpdated.current[playerId] > CACHE_TIMEOUT
   ) {
    // Загружаем свежие данные карточки
    await fetchPlayerCard(playerId, true);
   }
  } catch (error) {
   console.error(`Failed to load player card ${playerId}:`, error);
  }
 };
 
 // Вычисляем статистику по карточкам
 const updateCardStats = useMemo(() => {
  const calculateStats = () => {
   if (statsLoading) return;
   
   try {
    setStatsLoading(true);
    
    const withCards = Object.values(playerCardsData).filter(data => data !== null && data !== undefined);
    const totalCards = withCards.length;
    
    const withRoadmap = withCards.filter(data => 
     data && data.playerCard && data.playerCard.roadmap && data.playerCard.roadmap.length > 0
    ).length;
    
    const withMindmap = withCards.filter(data => 
     data && data.playerCard && data.playerCard.mindmap && data.playerCard.mindmap.length > 0
    ).length;
    
    const withCommunicationLine = withCards.filter(data => 
     data && data.playerCard && data.playerCard.communicationLine && data.playerCard.communicationLine.length > 0
    ).length;
    
    // Formatирование текущей даты
    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat('en-US', {
     day: '2-digit',
     month: '2-digit',
     year: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
    }).format(now);
    
    setCardsStats({
     total: totalCards,
     withRoadmap,
     withMindmap,
     withCommunicationLine,
     lastUpdated: dateFormatted
    });
   } catch (error) {
    console.error("Error while calculating statistics:", error);
   } finally {
    setStatsLoading(false);
   }
  };
  
  return calculateStats;
 }, [playerCardsData, statsLoading]);
 
 // Вызываем обновление статистики при changении данных карточек
 useEffect(() => {
  updateCardStats();
 }, [playerCardsData, updateCardStats]);
 
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
 
 // Loading Roadmap
 const handleRoadmapChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!selectedPlayerId) return;
  
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
   setUploadingRoadmap(true);
   
   // Сохраняем предыдущие данные для возможного отката
   const previousData = playerCardsData[selectedPlayerId];
   
   // Создаем временный URL для предпросмотра (оптимистичное обновление UI)
   const tempUrl = URL.createObjectURL(file);
   
   // Оптимистично обновляем UI
   if (playerCardsData[selectedPlayerId]) {
    setPlayerCardsData(prev => ({
     ...prev,
     [selectedPlayerId]: {
      ...playerCardsData[selectedPlayerId],
      playerCard: {
       ...playerCardsData[selectedPlayerId].playerCard,
       roadmap: tempUrl // Временный URL для отображения
      }
     }
    }));
   }
   
   const result = await uploadRoadmap(file, selectedPlayerId);
   
   if (result.success && result.data) {
    toast.success("Roadmap uploaded successfully");
    
    // Обновляем данные в состоянии с реальным URL
    if (playerCardsData[selectedPlayerId]) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: {
       ...playerCardsData[selectedPlayerId],
       playerCard: {
        ...playerCardsData[selectedPlayerId].playerCard,
        roadmap: result.data.roadmap
       }
      }
     }));
    }
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[selectedPlayerId] = Date.now();
   } else {
    toast.error(result.error || "Failed to upload Roadmap");
    
    // Откатываем changes в случае ошибки
    if (previousData) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: previousData
     }));
    }
   }
   
   // Освобождаем временный URL
   URL.revokeObjectURL(tempUrl);
  } catch (error) {
   console.error("Roadmap upload failed:", error);
   toast.error("Roadmap upload failed");
  } finally {
   setUploadingRoadmap(false);
   if (roadmapFileRef.current) {
    roadmapFileRef.current.value = "";
   }
  }
 };
 
 // Loading Mindmap
 const handleMindmapChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!selectedPlayerId) return;
  
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
   setUploadingMindmap(true);
   
   // Сохраняем предыдущие данные для возможного отката
   const previousData = playerCardsData[selectedPlayerId];
   
   // Создаем временный URL для предпросмотра (оптимистичное обновление UI)
   const tempUrl = URL.createObjectURL(file);
   
   // Оптимистично обновляем UI
   if (playerCardsData[selectedPlayerId]) {
    setPlayerCardsData(prev => ({
     ...prev,
     [selectedPlayerId]: {
      ...playerCardsData[selectedPlayerId],
      playerCard: {
       ...playerCardsData[selectedPlayerId].playerCard,
       mindmap: tempUrl // Временный URL для отображения
      }
     }
    }));
   }
   
   const result = await uploadMindmap(file, selectedPlayerId);
   
   if (result.success && result.data) {
    toast.success("Mindmap uploaded successfully");
    
    // Обновляем данные в состоянии с реальным URL
    if (playerCardsData[selectedPlayerId]) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: {
       ...playerCardsData[selectedPlayerId],
       playerCard: {
        ...playerCardsData[selectedPlayerId].playerCard,
        mindmap: result.data.mindmap
       }
      }
     }));
    }
    
    // Обновляем время последнего обновления в кэше
    lastUpdated.current[selectedPlayerId] = Date.now();
   } else {
    toast.error(result.error || "Failed to upload Mindmap");
    
    // Откатываем changes в случае ошибки
    if (previousData) {
     setPlayerCardsData(prev => ({
      ...prev,
      [selectedPlayerId]: previousData
     }));
    }
   }
   
   // Освобождаем временный URL
   URL.revokeObjectURL(tempUrl);
  } catch (error) {
   console.error("Mindmap upload failed:", error);
   toast.error("Mindmap upload failed");
  } finally {
   setUploadingMindmap(false);
   if (mindmapFileRef.current) {
    mindmapFileRef.current.value = "";
   }
  }
 };
 
 // Функция восстановления данных при ошибках
 const handleRecoverData = async () => {
  try {
   toast.info("Trying to recover data...");
   
   // Очищаем кэш для принудительного обновления
   lastUpdated.current = {};
   pendingRequests.current = {};
   
   // Перезагружаем список players
   await fetchPlayers();
   
   // Если выбран player, обновляем его данные
   if (selectedPlayerId) {
    await fetchPlayerCard(selectedPlayerId, true);
   }
   
   // Обновляем данные для всех видимых карточек
   if (expandedCardId) {
    await fetchPlayerCard(expandedCardId, true);
   }
   
   // Обновляем статистику
   updateCardStats();
   
   // Принудительно обновляем компонент
   forceUpdate();
   
   toast.success("Data recovered successfully");
  } catch (error) {
   console.error("Error while restoring data:", error);
   toast.error("Failed to recover data. Try refreshing the page.");
  }
 };

 // Функция открытия диалога привязки player
 // Функция для открытия диалога создания карточки
 const handleOpenCreatePlayerCardDialog = async () => {
  try {
   // Satрасываем все состояния перед открытием диалога
   resetAllPlayerStates();
   
   console.log('Loading players for the card creation dialog...');
   
   // Показываем индикатор загрузки
   setLoadingPlayers(true);
   
   // Загружаем players и карточки параллельно
   const [playersResult, cardsResult] = await Promise.all([
    getPlayers(),
    getAllPlayerCards()
   ]);
   
   if (playersResult.data && Array.isArray(playersResult.data)) {
    // Normalлofация данных players (убираем фильтрацию по роли здесь)
    const normalizedPlayers = playersResult.data
     .filter(p => p && (p._id || p.id))
     .map(p => {
      const id = (p as any)._id || p.id;
      return {
       id: id,
       name: p.name || "Unknown",
       email: p.email || "",
       role: p.role
      };
     });
    
    setPlayers(normalizedPlayers);
    
    // Обрабатываем карточки для корректной фильтрации
    if (cardsResult.success && cardsResult.data?.data) {
     const cardData: { [key: string]: any } = {};
     cardsResult.data.data.forEach(card => {
      if (card && card.userId) {
       cardData[card.userId] = card;
      }
     });
     setPlayerCardsData(prev => ({ ...prev, ...cardData }));
    }
    
    console.log(`Loaded ${normalizedPlayers.length} players для диалога`);
    
    // Открываем диалог только после успешной загрузки данных
    setShowAddPlayerDialog(true);
   } else {
    console.error("Invalid player data format:", playersResult.data);
    toast.error("Failed to load player list: invalid data format");
   }
  } catch (error) {
   console.error('Error while opening create-card dialog:', error);
   toast.error('Failed to load player list');
  } finally {
   setLoadingPlayers(false);
  }
 };

 const handleOpenAttachPlayerDialog = async () => {
  setLoadingAttachDialog(true);
  try {
   console.log("=== LINK DIALOG DEBUG ===");
   console.log("Opening player link dialog...");
   
   // Принудительно загружаем свежие данные players
   console.log("1. Loading all players from /api/users/players...");
   const playersResult = await getPlayers();
   let allPlayers = [];
   
   if (playersResult && playersResult.data && Array.isArray(playersResult.data)) {
    allPlayers = playersResult.data.map(p => ({
     id: p._id || p.id,
     name: p.name || "Unknown",
     email: p.email || "",
     role: p.role
    }));
    console.log(`Loaded ${allPlayers.length} players of базы:`, allPlayers);
   } else {
    console.error("Failed to load players:", playersResult);
    toast.error("Failed to load player list");
    return;
   }
   
   // Принудительно обновляем данные карточек перед открытием диалога
   console.log("2. Loading all existing cards from /api/player-cards...");
   const cardsResult = await getAllPlayerCards();
   let existingCardUserIds: Set<string> = new Set();
   
   if (cardsResult.success && cardsResult.data?.data) {
    setAvailableCards(cardsResult.data.data);
    console.log(`Loaded ${cardsResult.data.data.length} карточек:`, cardsResult.data.data);
    
    // Собираем ID пользователей, у которых уже есть карточки
    cardsResult.data.data.forEach(card => {
     if (card && card.userId) {
      existingCardUserIds.add(card.userId.toString());
      console.log(`Card найдена для player: ${card.userId} (${card.user?.name || 'Unnamed'})`);
     }
    });
    
    console.log("User IDs with cards:", Array.from(existingCardUserIds));
   } else {
    console.error("Failed to load cards:", cardsResult);
    setAvailableCards([]);
   }
   
   // Фильтруем players без карточек, используя актуальные данные
   console.log("3. Filtering players without cards...");
   const playersWithoutCards = allPlayers.filter(player => {
    const hasCard = existingCardUserIds.has(player.id.toString());
    console.log(`Player ${player.name} (${player.id}): есть карточка = ${hasCard}`);
    return !hasCard;
   });
   
   console.log("=== FILTER RESULT ===");
   console.log(`Total players в базе: ${allPlayers.length}`);
   console.log(`Players with карточками: ${existingCardUserIds.size}`);
   console.log(`Players without cards: ${playersWithoutCards.length}`);
   console.log("Players without cards:", playersWithoutCards);
   
   setAvailablePlayersForAttach(playersWithoutCards);
   setShowAttachPlayerDialog(true);
  } catch (error) {
   console.error("Error while opening link dialog:", error);
   toast.error("Failed to load linking data");
  } finally {
   setLoadingAttachDialog(false);
  }
 };

 // Функция привязки player к карточке
 const handleAttachPlayer = async () => {
  if (!selectedCardForAttach || !selectedPlayerForAttach) {
   toast.error("Choose a card and player to link");
   return;
  }

  try {
   setAttachingPlayer(true);
   
   const result = await attachPlayerToCard(selectedCardForAttach, selectedPlayerForAttach);
   
   if (result.success) {
    toast.success("Player linked to card successfully");
    
    // Обновляем данные карточек
    setPlayerCardsData(prev => ({
     ...prev,
     [selectedPlayerForAttach]: result.data
    }));
    
    // Закрываем диалог и сбрасываем состояния
    setShowAttachPlayerDialog(false);
    setSelectedCardForAttach("");
    setSelectedPlayerForAttach("");
    
    // Обновляем список players и карточек
    await fetchPlayers();
    forceUpdate();
   } else {
    toast.error(result.error || "Failed to link player to card");
   }
  } catch (error) {
   console.error("Error while linking player:", error);
   toast.error("An error occurred while linking the player");
  } finally {
   setAttachingPlayer(false);
  }
 };
 
 // Для solo-player используем данные of useAuth как данные текущего player
 const currentPlayerForDetail = selectedPlayerId
  ? (players.find(p => p.id === selectedPlayerId) || (isSoloPlayer ? { id: user?.id || '', name: user?.name || 'Unnamed', email: user?.email || '' } : null))
  : null;

 // Компонент для загрузки списка players
 if (loadingPlayers) {
  return (
   <div className="container mx-auto performance-page flex flex-col justify-center items-center h-[80vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <span className="mb-4">Loading player list...</span>
    
    {/* Индикатор прогресса */}
    <div className="w-full max-w-md bg-muted rounded-full h-2.5 mb-2">
     <div 
      className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
      style={{ width: `${loadingProgress}%` }}
      role="progressbar"
      aria-valuenow={loadingProgress}
      aria-valuemin={0}
      aria-valuemax={100}
     ></div>
    </div>
    
    {/* Отображение percentа загрузки */}
    <span className="text-sm text-muted-foreground">{loadingProgress}%</span>
   </div>
  );
 }
 
 return (
  <div className="container px-4 py-6 mx-auto performance-page">
   {/* Добавляем стили анимаций */}
   <style>{animationStyles}</style>

   <div className="mb-4">
    <PageIntro
     eyebrow={isSoloPlayer ? "Player card" : "Team cards"}
     title={isSoloPlayer ? "My card: quick player context" : "Player cards: context for team work"}
     description={
      isSoloPlayer
       ? "Your working profile lives here: contacts, development map, and context that helps you understand yourself faster without jumping across sections."
       : "This section keeps player context together for staff: contacts, development maps, and materials connected to the broader CRM workflow."
     }
     bullets={[
      "The card adds context to analytics",
      "Use this section before decisions or communication",
      "Contacts, roadmap, and mindmap stay in one place",
     ]}
    />
   </div>

   {/* Панель инструментов — только для стаффа */}
   {user?.role === "staff" && <div className="flex justify-between items-center mb-6">
    <div className="relative w-full max-w-xs">
     <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
     <Input
      placeholder="Search players..."
      className="pl-8 pr-4"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
     />
    </div>
    <div className="flex space-x-2">
     <Button 
      variant="outline"
      onClick={handleRecoverData}
      disabled={loadingPlayers}
      className="text-foreground"
      title="Recover data if errors occur"
     >
      <AlertCircle className="h-4 w-4 mr-2" />
      Restore
     </Button>
     <Button 
      variant="outline"
      onClick={() => {
       console.log("=== DATA DEBUG ===");
       console.log("Players:", players);
       console.log("Card data:", playerCardsData);
       console.log("Available cards:", availableCards);
       console.log("Available players to link:", availablePlayersForAttach);
       
       // Дополнительная отладка
       console.log("=== DETAILED CHECK ===");
       players.forEach(player => {
        const hasCardInData = playerCardsData[player.id] && playerCardsData[player.id] !== null;
        const hasCardInAvailable = availableCards.some(card => card.userId === player.id);
        console.log(`Player: ${player.name} (${player.id})`);
        console.log(` - Yes в playerCardsData: ${hasCardInData}`);
        console.log(` - Yes в availableCards: ${hasCardInAvailable}`);
       });
      }}
      disabled={loadingPlayers}
      className="text-foreground"
      title="Debug data"
     >
      <Bug className="h-4 w-4 mr-2" />
      Debug
     </Button>
     <Button 
      variant="outline"
      onClick={handleOpenAttachPlayerDialog}
      disabled={loadingPlayers || loadingAttachDialog}
      className="text-foreground"
      title="Link an existing card to a player"
     >
      {loadingAttachDialog ? (
       <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
       </>
      ) : (
       <>
        <Link className="h-4 w-4 mr-2" />
        Link player
       </>
      )}
     </Button>
    <Button 
     className="bg-primary hover:bg-primary/90"
     onClick={handleOpenCreatePlayerCardDialog}
     disabled={loadingPlayers}
    >
     {loadingPlayers ? (
      <>
       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
       Loading...
      </>
     ) : (
      <>
     <Plus className="h-4 w-4 mr-2" />
     Add карточку
      </>
     )}
    </Button>
    </div>
   </div>}

   {/* Отображаем или список карточек, или детальный вид */}
   {displayMode === DisplayMode.GRID ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredPlayers.length === 0 && players.length > 0 && (
     <div className="col-span-full flex flex-col items-center justify-center p-6 text-muted-foreground">
      <Search className="h-10 w-10 mb-4 opacity-50" />
      <p>No результатов для поиска "{searchQuery}"</p>
      <Button 
       variant="outline" 
       className="mt-4" 
       onClick={() => setSearchQuery("")}
      >
       Satросить поиск
      </Button>
     </div>
    )}
    
    {players.length === 0 && !loadingPlayers && (
     <div className="col-span-full flex flex-col items-center justify-center p-6 text-muted-foreground">
      <Users className="h-10 w-10 mb-4 opacity-50" />
      <p>No players в системе</p>
      <Button 
       variant="outline" 
       className="mt-4" 
       onClick={handleOpenCreatePlayerCardDialog}
      >
       Create карточку player
      </Button>
     </div>
    )}
    
    {filteredPlayers.map((player) => {
     // Проверяем наличие ID для безопасного рендеринга
     if (!player || !player.id) {
      console.error("Player without ID detected:", player);
      return null;
     }
     
     // ВАЖНО: Проверяем, была ли карточка удалена
     if (playerCardsData[player.id] === null) {
      console.log(`Player card ${player.id} была удалена, скрываем её`);
      return null; // Если карточка была удалена, не показываем её
     }
     
     try {
      return (
       <Card 
        key={player.id} 
        className="overflow-hidden transition-all duration-300 hover:shadow-md animate-fadeIn"
        data-player-id={player.id}
       >
        <CardHeader 
         className={`bg-muted/30 pb-4 ${expandedCardId === player.id ? 'player-card-active' : ''}`}
         onClick={() => handleToggleCard(player.id)}
         style={{ cursor: 'pointer' }}
        >
         <div className="flex items-center gap-3">
          <UserAvatar user={player} className="h-10 w-10" />
          <div>
           <CardTitle className="text-lg">{player.name || "Unnamed"}</CardTitle>
           <CardDescription>{player.email || "Email missing"}</CardDescription>
          </div>
         </div>
         
         {/* Индикатор состояния карточки */}
         {expandedCardId === player.id && (
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
           <ChevronDown className="h-4 w-4 mr-1" />
           Click, чтобы свернуть
          </div>
         )}
         {expandedCardId !== player.id && (
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
           <Info className="h-4 w-4 mr-1" />
           Click, чтобы раскрыть подробности
          </div>
         )}
        </CardHeader>
        <CardContent className="pt-4">
         <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-sm">
           <span className="text-muted-foreground">Nickname:</span> 
           <span>{playerCardsData[player.id]?.playerCard?.contacts?.nickname || "-"}</span>
          </div>
          <div className="text-sm">
           <span className="text-muted-foreground">VK:</span> 
           <span>{playerCardsData[player.id]?.playerCard?.contacts?.vk || "-"}</span>
          </div>
          <div className="text-sm">
           <span className="text-muted-foreground">Telegram:</span> 
           <span>{playerCardsData[player.id]?.playerCard?.contacts?.telegram || "-"}</span>
          </div>
          <div className="text-sm">
           <span className="text-muted-foreground">Steam:</span> 
           <span>{playerCardsData[player.id]?.playerCard?.contacts?.steam || "-"}</span>
          </div>
          <div className="text-sm">
           <span className="text-muted-foreground">Faceit:</span> 
           <span>{playerCardsData[player.id]?.playerCard?.contacts?.faceit || "-"}</span>
          </div>
         </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/10 pt-2">
         <div className="flex space-x-1">
          <Button 
           variant="ghost" 
           size="sm"
           onClick={() => handleViewPlayerDetails(player.id)}
          >
           Edit
          </Button>
          
          {/* Кнопка удаления карточки - исправленная версия */}
          {playerCardsData[player.id]?.playerCard && (
           <Button 
            variant="destructive" 
            size="sm"
            onClick={async (e) => {
             e.stopPropagation(); // Prevотвращаем всплытие события
             
             // Получаем данные карточки
             const card = playerCardsData[player.id]?.playerCard;
             if (!card) {
              toast.error('Card not found');
              return;
             }
             
             // Используем userId вместо _id карточки
             const userId = card.userId;
             if (!userId) {
              toast.error('User ID not found in card');
              console.error('Missing userId in card:', card);
              return;
             }
             
             // Подтверждение
             if (!confirm(`Delete player card ${player.name}?`)) {
              return;
             }
             
             // Делаем кнопку неактивной во время удаления
             const deleteBtn = e.currentTarget as HTMLButtonElement;
             deleteBtn.disabled = true;
             
             try {
              // Используем нашу безопасную функцию удаления
              await safeDeletePlayerCard(userId, player.name, player.id, () => {
               // Дополнительные действия после успешного удаления, если нужны
              });
             } finally {
              //  кнопку в любом случае
              deleteBtn.disabled = false;
             }
            }}
            className="bg-destructive hover:bg-destructive/90"
           >
            <Trash className="h-4 w-4 mr-1" />
            Delete
           </Button>
          )}
         </div>
         <div className="flex items-center space-x-2">
          {/* Индикация загрузки данных */}
          {playerCardsData[player.id] === undefined && (
           <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          
          {/* Индикация отсутствия карточки */}
          {playerCardsData[player.id] === null && (
           <AlertCircle className="h-4 w-4 text-destructive" aria-label="Card not created" />
          )}
          
          {/* Индикация наличия данных */}
          {playerCardsData[player.id]?.playerCard?.roadmap && (
           <FileImage className="h-5 w-5 text-primary drop-shadow-md" aria-label="Roadmap added" />
          )}
          {playerCardsData[player.id]?.playerCard?.mindmap && (
           <FileBarChart className="h-5 w-5 text-primary drop-shadow-md" aria-label="Mindmap added" />
          )}
          {playerCardsData[player.id]?.playerCard?.communicationLine && (
           <MessageSquare className="h-5 w-5 text-primary drop-shadow-md" aria-label="Communication line added" />
          )}
         </div>
        </CardFooter>
       </Card>
      );
     } catch (error) {
      console.error(`Error while рендеринге карточки player ${player?.id}:`, error);
      return (
       <Card key={player.id || `error-${Date.now()}`} className="overflow-hidden bg-destructive/10">
        <CardHeader>
         <CardTitle>Error отображения</CardTitle>
        </CardHeader>
        <CardContent>
         <p>An error occurred при отображении карточки player.</p>
        </CardContent>
       </Card>
      );
     }
    })}
    </div>
   ) : (
    // Детальный режим просмотра карточки player
    <div className="space-y-6 animate-fadeIn">
     {/* Кнопки навигации и действий — скрыты для solo-players */}
     {!isSoloPlayer && (
     <div className="flex justify-between items-center">
      <Button
       variant="outline"
       onClick={handleBackToGrid}
       className="bg-background text-foreground hover:bg-secondary/80"
      >
       <ChevronDown className="h-4 w-4 mr-2 rotate-90" />
       Back to list
      </Button>

      {/* Кнопка удаления карточки - прямое удаление */}
      {playerHasCard && (
       <Button 
        variant="destructive" 
        size="sm"
        onClick={async () => {
         // Получаем данные выбранного player
         const player = players.find(p => p.id === selectedPlayerId);
         if (!player) {
          toast.error('Player not found');
          return;
         }
         
         // Получаем данные карточки
         const playerData = playerCardsData[selectedPlayerId];
         if (!playerData || !playerData.playerCard) {
          toast.error('Card not found');
          return;
         }
         
         // Получаем userId
         const userId = playerData.playerCard.userId;
         if (!userId) {
          toast.error('User ID not found in card');
          return;
         }
         
         // Подтверждение
         if (!confirm(`Delete player card ${player.name}?`)) {
          return;
         }
         
         // Устанавливаем состояние загрузки
         setDeleting(true);
         
         try {
          // Используем универсальную функцию удаления
          const success = await safeDeletePlayerCard(userId, player.name, selectedPlayerId, () => {
           // Очищаем формы
           setContacts({
            vk: "",
            telegram: "",
            faceit: "",
            steam: "",
            nickname: ""
           });
           setCommunicationLine("");
           
           // Satрасываем флаг наличия карточки
           setPlayerHasCard(false);
           
           // Возвращаемся к списку players
           setDisplayMode(DisplayMode.GRID);
           setSelectedPlayerId("");
          });
          
          // Если удаление не удалось, обновляем данные
          if (!success) {
           // Обновляем данные на странице, чтобы показать актуальные данные
           setForceUpdateCounter(prev => prev + 1);
          }
         } finally {
          setDeleting(false);
         }
        }}
        disabled={deleting}
        className="bg-destructive/90 hover:bg-destructive"
       >
        {deleting ? (
         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
         <Trash className="h-4 w-4 mr-2" />
        )}
        Delete card
       </Button>
      )}
     </div>
     )}

     {/* Basic information об playerе — для solo-player используем данные of useAuth */}
     {selectedPlayerId && currentPlayerForDetail && (
      <Card className="shadow-md">
       <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-4">
         <UserAvatar
          user={currentPlayerForDetail}
          className="h-14 w-14 border-2 border-background shadow-sm"
         />
         <div>
          <CardTitle className="text-2xl">
           {currentPlayerForDetail.name || "Unnamed"}
          </CardTitle>
          <CardDescription className="text-base">
           {(currentPlayerForDetail as any).email || "No email"}
          </CardDescription>
         </div>
        </div>
       </CardHeader>

       <CardContent className="pt-6 space-y-6">
        {/* Кнопка создания карточки (если карточки нет) */}
        {!loading && !playerHasCard && (
         <div className="flex flex-col items-center justify-center py-6 space-y-3 border rounded-md bg-muted/10">
          <CreditCard className="h-10 w-10 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No extra card created</p>
          <Button
           onClick={handleCreatePlayerCard}
           disabled={creatingCard}
           className="bg-primary hover:bg-primary/90"
          >
           {creatingCard ? (
            <>
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
             Creating...
            </>
           ) : (
            <>
             <Plus className="h-4 w-4 mr-2" />
             Create мою карточку
            </>
           )}
          </Button>
         </div>
        )}
        {loading ? (
         <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
        ) : playerHasCard ? (
         <>
          {playerCardsData[selectedPlayerId]?.baselineAssessment?.personality?.summary &&
           playerCardsData[selectedPlayerId]?.baselineAssessment?.cs2Role && (
            <>
             <div className="space-y-4">
              <div className="flex items-center justify-between">
               <h3 className="text-lg font-semibold">Player baseline profile</h3>
               <span className="text-sm text-muted-foreground">Starting outline after registration</span>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
               <Card className="border-cyan-400/15 bg-[linear-gradient(145deg,rgba(17,24,39,0.98),rgba(18,40,64,0.82))] text-white">
                <CardHeader className="pb-3">
                 <CardTitle className="text-2xl">
                  {playerCardsData[selectedPlayerId]?.baselineAssessment?.personality?.summary?.archetype}
                 </CardTitle>
                 <CardDescription className="text-slate-300">
                  {playerCardsData[selectedPlayerId]?.baselineAssessment?.personality?.summary?.headline}
                 </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                 <p className="text-sm leading-7 text-slate-300">
                  {playerCardsData[selectedPlayerId]?.baselineAssessment?.personality?.summary?.description}
                 </p>
                 <div className="flex flex-wrap gap-2">
                  {playerCardsData[selectedPlayerId]?.baselineAssessment?.personality?.summary?.styleTags?.map((tag) => (
                   <span
                    key={tag}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-200"
                   >
                    {tag}
                   </span>
                  ))}
                 </div>
                </CardContent>
               </Card>

               <Card className="bg-muted/20">
                <CardHeader className="pb-3">
                 <CardTitle className="text-lg">Role in CS2</CardTitle>
                 <CardDescription>
                  How the player distributes responsibility by roles and round phases.
                 </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                 <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Primary role</span>
                  <span className="font-medium text-foreground">
                   {playerCardsData[selectedPlayerId]?.baselineAssessment?.cs2Role?.primaryRole}
                  </span>
                 </div>
                 <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Secondary role</span>
                  <span className="font-medium text-foreground">
                   {playerCardsData[selectedPlayerId]?.baselineAssessment?.cs2Role?.secondaryRole || "Not specified"}
                  </span>
                 </div>
                 <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Preferred side</span>
                  <span className="font-medium text-foreground">
                   {playerCardsData[selectedPlayerId]?.baselineAssessment?.cs2Role?.sidePreference}
                  </span>
                 </div>
                 <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Strong phase</span>
                  <span className="font-medium text-foreground">
                   {playerCardsData[selectedPlayerId]?.baselineAssessment?.cs2Role?.roundStrength}
                  </span>
                 </div>
                </CardContent>
               </Card>
              </div>
             </div>

             <Separator />
            </>
           )}

          {/* Player card (v1): индексы и таймлайн */}
          <div className="space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Player card (v1)</h3>
            <span className="text-sm text-muted-foreground">Indexes 7/30 days</span>
           </div>
           
           {dashboardLoading && (
            <div className="flex items-center text-muted-foreground">
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
             Loading индексов...
            </div>
           )}
           
           {!dashboardLoading && dashboardError && (
            <div className="text-sm text-destructive">{dashboardError}</div>
           )}
           
           {!dashboardLoading && !dashboardError && !dashboardData && (
            <div className="text-sm text-muted-foreground">No data for indexes</div>
           )}
           
           {!dashboardLoading && dashboardData && (
            <>
             <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Readiness</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.readiness)}
               </CardContent>
              </Card>
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.performance)}
               </CardContent>
              </Card>
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Discipline</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.discipline)}
               </CardContent>
              </Card>
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Success</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.success)}
               </CardContent>
              </Card>
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Brain</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.brainPerformance)}
               </CardContent>
              </Card>
              <Card className="bg-muted/20">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm">Confidence</CardTitle>
               </CardHeader>
               <CardContent className="pt-0 text-2xl font-semibold">
                {formatScore(dashboardData.scores.confidence)}
               </CardContent>
              </Card>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border bg-muted/10 p-3">
               <div className="text-sm font-medium mb-2">Drivers (7 days)</div>
               <div className="space-y-1 text-sm">
                {dashboardData.drivers.length > 0 ? (
                 dashboardData.drivers.map((driver) => (
                  <div key={driver.label} className="flex justify-between text-muted-foreground">
                   <span>{driver.label}</span>
                   <span className="text-foreground">{formatScore(driver.value)}</span>
                  </div>
                 ))
                ) : (
                 <div className="text-muted-foreground">No driver data</div>
                )}
               </div>
              </div>
              
              <div className="rounded-md border bg-muted/10 p-3">
               <div className="text-sm font-medium mb-2">7/30 timeline</div>
               <Tabs defaultValue="days7">
                <TabsList>
                 <TabsTrigger value="days7">7</TabsTrigger>
                 <TabsTrigger value="days30">30</TabsTrigger>
                </TabsList>
                <TabsContent value="days7" className="mt-2">
                 <div className="grid grid-cols-1 gap-2 text-xs">
                  {dashboardData.timeline.days7.length > 0 ? (
                   dashboardData.timeline.days7.map((point) => (
                    <div key={point.date} className="flex justify-between text-muted-foreground">
                     <span>{point.date}</span>
                     <span className="text-foreground">
                      R {formatScore(point.readiness)} · P {formatScore(point.performance)} · D {formatScore(point.discipline)} · S {formatScore(point.success)}
                     </span>
                    </div>
                   ))
                  ) : (
                   <div className="text-muted-foreground">No data for 7 days</div>
                  )}
                 </div>
                </TabsContent>
                <TabsContent value="days30" className="mt-2">
                 <div className="grid grid-cols-1 gap-2 text-xs">
                  {dashboardData.timeline.days30.length > 0 ? (
                   dashboardData.timeline.days30.map((point) => (
                    <div key={point.date} className="flex justify-between text-muted-foreground">
                     <span>{point.date}</span>
                     <span className="text-foreground">
                      R {formatScore(point.readiness)} · P {formatScore(point.performance)} · D {formatScore(point.discipline)} · S {formatScore(point.success)}
                     </span>
                    </div>
                   ))
                  ) : (
                   <div className="text-muted-foreground">No data for 30 days</div>
                  )}
                 </div>
                </TabsContent>
               </Tabs>
              </div>
             </div>
            </>
           )}
          </div>

          <Separator />

          {/* Contacts */}
          <div className="space-y-4">
           <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contacts</h3>
            <Button 
             variant="outline" 
             size="sm" 
             onClick={handleSaveContacts}
             disabled={saving}
            >
             {saving ? (
              <>
               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               Saving...
              </>
             ) : (
              <>
               <Send className="h-4 w-4 mr-2" />
               Save
              </>
             )}
            </Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
             <Label htmlFor="nickname">Nickname</Label>
             <Input 
              id="nickname" 
              name="nickname" 
              value={contacts.nickname} 
              onChange={handleContactsChange} 
              placeholder="Game nickname"
             />
            </div>
            <div className="space-y-2">
             <Label htmlFor="vk">VK</Label>
             <Input 
              id="vk" 
              name="vk" 
              value={contacts.vk} 
              onChange={handleContactsChange} 
              placeholder="https://vk.com/id"
             />
            </div>
            <div className="space-y-2">
             <Label htmlFor="telegram">Telegram</Label>
             <Input 
              id="telegram" 
              name="telegram" 
              value={contacts.telegram} 
              onChange={handleContactsChange} 
              placeholder="@username"
             />
            </div>
            <div className="space-y-2">
             <Label htmlFor="faceit">Faceit</Label>
             <Input 
              id="faceit" 
              name="faceit" 
              value={contacts.faceit} 
              onChange={handleContactsChange} 
              placeholder="https://www.faceit.com/en/players/"
             />
            </div>
            <div className="space-y-2">
             <Label htmlFor="steam">Steam</Label>
             <Input 
              id="steam" 
              name="steam" 
              value={contacts.steam} 
              onChange={handleContactsChange} 
              placeholder="https://steamcommunity.com/id/"
             />
            </div>
           </div>
          </div>

          <Separator />

          {/* Communication line */}
          <div className="space-y-4">
           <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Communication line</h3>
            <div className="flex space-x-2">
             <Button 
              variant="outline" 
              size="sm" 
              onClick={() => communicationLineImageRef.current?.click()}
              disabled={uploadingCommunicationImage}
              title="Upload image"
             >
              {uploadingCommunicationImage ? (
               <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
               </>
              ) : (
               <>
                <Image className="h-4 w-4 mr-2" />
                Upload image
               </>
              )}
             </Button>
             <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveCommunicationLine}
              disabled={savingCommunicationLine}
             >
              {savingCommunicationLine ? (
               <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
               </>
              ) : (
               <>
                <Send className="h-4 w-4 mr-2" />
                Save
               </>
              )}
             </Button>
            </div>
           </div>

           <div className="space-y-4">
            {/* Отображение images коммуникативной линии */}
            {playerCardsData[selectedPlayerId]?.playerCard?.communicationImage ? (
             <div className="relative rounded-md overflow-hidden border bg-muted/30 group img-hover-zoom mb-4">
              <SafeImage 
               src={getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.communicationImage)} 
               alt="Communication line image" 
               className="w-full h-auto max-h-64 object-contain transition-transform duration-300 group-hover:scale-105"
               fallback="Image load error" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 text-black hover:bg-white"
                onClick={() => window.open(getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.communicationImage) || playerCardsData[selectedPlayerId]?.playerCard?.communicationImage, '_blank')}
               >
                <Search className="h-4 w-4 mr-2" />
                View
               </Button>
              </div>
             </div>
            ) : (
             <div className="flex flex-col items-center justify-center p-4 mb-4 text-muted-foreground border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" 
                onClick={() => communicationLineImageRef.current?.click()}
             >
              <FileImage className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No communication line image</p>
              <p className="text-xs mt-1 text-primary">Click to upload</p>
             </div>
            )}
            
            {/* Поле ввода текста */}
            <div className="space-y-2">
             <Textarea 
              value={communicationLine} 
              onChange={handleCommunicationLineChange} 
              placeholder="Enter the player communication line..."
              rows={5}
             />
            </div>
            
            {/* Скрытый input для загрузки images */}
            <input
             type="file"
             ref={communicationLineImageRef}
             style={{ display: "none" }}
             accept="image/*"
             onChange={(e) => {
              handleCommunicationImageChange(e);
              if (communicationLineImage) {
               handleUploadCommunicationImage();
              }
             }}
            />
            
            {/* Показываем информацию о выбранном файле */}
            {communicationLineImage && (
             <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileImage className="h-4 w-4" />
              <span>Selected: {communicationLineImage.name}</span>
             </div>
            )}
           </div>
          </div>

          <Separator />

          {/* Development maps */}
          <div className="space-y-4">
           <h3 className="text-lg font-semibold">Development maps</h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Roadmap */}
            <div className="space-y-3 border rounded-lg p-4">
             <div className="flex justify-between items-center">
              <h4 className="font-medium">Roadmap</h4>
              <Button 
               variant="outline" 
               size="sm" 
               onClick={handleRoadmapClick}
               disabled={uploadingRoadmap}
              >
               {uploadingRoadmap ? (
                <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                <Upload className="h-4 w-4" />
               )}
               <span className="ml-2">
                {playerCardsData[selectedPlayerId]?.playerCard?.roadmap ? 'Edit' : 'Upload'}
               </span>
              </Button>
             </div>

             {/* Отображение Roadmap, если есть */}
             {playerCardsData[selectedPlayerId]?.playerCard?.roadmap ? (
              <div className="relative aspect-square rounded-md overflow-hidden border bg-muted/30 group img-hover-zoom">
               <SafeImage 
                src={getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.roadmap)} 
                alt="Roadmap" 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                fallback="Loading error Roadmap" 
               />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="bg-white/90 text-black hover:bg-white"
                 onClick={() => window.open(getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.roadmap) || playerCardsData[selectedPlayerId]?.playerCard?.roadmap, '_blank')}
                >
                 <Search className="h-4 w-4 mr-2" />
                 View
                </Button>
               </div>
              </div>
             ) : (
              <div className="flex flex-col items-center justify-center p-6 text-muted-foreground border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={handleRoadmapClick}>
               <FileImage className="h-10 w-10 mb-2 opacity-50" />
               <p className="text-sm">No roadmap image</p>
               <p className="text-xs mt-2 text-primary">Click to upload</p>
              </div>
             )}
            </div>

            {/* Mindmap */}
            <div className="space-y-3 border rounded-lg p-4">
             <div className="flex justify-between items-center">
              <h4 className="font-medium">Mindmap</h4>
              <Button 
               variant="outline" 
               size="sm" 
               onClick={handleMindmapClick}
               disabled={uploadingMindmap}
              >
               {uploadingMindmap ? (
                <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                <Upload className="h-4 w-4" />
               )}
               <span className="ml-2">
                {playerCardsData[selectedPlayerId]?.playerCard?.mindmap ? 'Edit' : 'Upload'}
               </span>
              </Button>
             </div>

             {/* Отображение Mindmap, если есть */}
             {playerCardsData[selectedPlayerId]?.playerCard?.mindmap ? (
              <div className="relative aspect-square rounded-md overflow-hidden border bg-muted/30 group img-hover-zoom">
               <SafeImage 
                src={getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.mindmap)} 
                alt="Mindmap" 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                fallback="Loading error Mindmap"
               />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="bg-white/90 text-black hover:bg-white"
                 onClick={() => window.open(getImageUrl(playerCardsData[selectedPlayerId]?.playerCard?.mindmap) || '', '_blank')}
                >
                 <Search className="h-4 w-4 mr-2" />
                 View
                </Button>
               </div>
              </div>
             ) : (
              <div className="flex flex-col items-center justify-center p-6 text-muted-foreground border rounded-md bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={handleMindmapClick}>
               <FileBarChart className="h-10 w-10 mb-2 opacity-50" />
               <p className="text-sm">No mind map image</p>
               <p className="text-xs mt-2 text-primary">Click to upload</p>
              </div>
             )}
            </div>
           </div>
          </div>
         </>
        ) : null}
       </CardContent>
      </Card>
     )}
    </div>
   )}
   
   {/* Диалог подтверждения удаления карточки */}
   <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
    <DialogContent className="sm:max-w-md">
     <DialogHeader>
      <DialogTitle className="text-destructive text-xl">Deleting player card</DialogTitle>
      <DialogDescription className="text-foreground">
       Are you sure you want to delete player card <strong>{currentPlayerName}</strong>?
       <div className="mt-2 text-destructive/90 text-sm">This action cannot be undone.</div>
      </DialogDescription>
     </DialogHeader>
     <div className="flex justify-end space-x-2 pt-4">
      <Button 
       variant="outline" 
       onClick={() => {
        setShowDeleteConfirmDialog(false);
        setPlayerToDeleteId("");
        setCurrentPlayerName("");
       }}
       disabled={deleting}
      >
       Cancel
      </Button>
      <Button 
       variant="destructive" 
       onClick={() => {
        // Вызываем функцию удаления карточки
        if (playerToDeleteId) {
         handleDeletePlayerCard();
        }
       }}
       disabled={deleting || !playerToDeleteId}
      >
       {deleting ? (
        <>
         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
         Deleting...
        </>
       ) : (
        <>
         <Trash className="h-4 w-4 mr-2" />
         Delete
        </>
       )}
      </Button>
     </div>
    </DialogContent>
   </Dialog>
   
   {/* Диалог добавления нового player */}
   <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
    <DialogContent className="sm:max-w-lg">
     <DialogHeader>
      <DialogTitle className="text-primary text-xl">Create player card</DialogTitle>
      <DialogDescription className="text-foreground">
       Select player и заполните данные для создания его карточки
      </DialogDescription>
     </DialogHeader>
     
     <Tabs defaultValue="contacts">
      <TabsList className="grid w-full grid-cols-3">
       <TabsTrigger value="contacts" className="font-medium">Contacts</TabsTrigger>
       <TabsTrigger value="communication" className="font-medium">Communication line</TabsTrigger>
       <TabsTrigger value="development" className="font-medium">Development maps</TabsTrigger>
      </TabsList>
      
      <TabsContent value="contacts">
       <div className="space-y-4 py-2">
        <div className="space-y-2">
         <Label className="text-foreground font-medium">Select player</Label>
         <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger className="text-foreground">
           <SelectValue placeholder="Choose a player to create a card" />
          </SelectTrigger>
          <SelectContent>
           {players
            .filter(player => {
             // Показываем только players с ролью 'player' и без карточек
             const hasCard = playerCardsData[player.id];
             const isPlayer = player.role === 'player';
             return isPlayer && (hasCard === null || hasCard === undefined);
            })
            .map(player => (
             <SelectItem key={player.id} value={player.id}>
              {player.name} ({player.email || 'No email'})
             </SelectItem>
            ))}
           {loadingPlayers ? (
            <div className="px-2 py-1 text-sm text-muted-foreground flex items-center">
             <Loader2 className="h-3 w-3 animate-spin mr-2" />
             Loading players...
            </div>
           ) : players.filter(player => {
            const hasCard = playerCardsData[player.id];
            const isPlayer = player.role === 'player';
            return isPlayer && (hasCard === null || hasCard === undefined);
           }).length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted-foreground">
             {players.length === 0 ? 'No available players' : 'All players already have cards'}
            </div>
           ) : null}
          </SelectContent>
         </Select>
         {/* Отладочная информация */}
         <div className="text-xs text-muted-foreground">
          Total players: {players.length}, players with role 'player': {players.filter(p => p.role === 'player').length}, without cards: {players.filter(player => {
           const hasCard = playerCardsData[player.id];
           const isPlayer = player.role === 'player';
           return isPlayer && (hasCard === null || hasCard === undefined);
          }).length}
          {loadingPlayers && " (loading...)"}
         </div>
        </div>
        <div className="space-y-2">
         <Label htmlFor="nickname" className="text-foreground font-medium">Nickname</Label>
         <Input 
          id="nickname" 
          name="contacts.nickname" 
          value={newPlayerData.contacts.nickname}
          onChange={handleDialogInputChange}
          placeholder="Game nickname" 
          className="text-foreground" 
         />
        </div>
        <div className="space-y-2">
         <Label htmlFor="vk" className="text-foreground font-medium">VK</Label>
         <Input 
          id="vk" 
          name="contacts.vk" 
          value={newPlayerData.contacts.vk}
          onChange={handleDialogInputChange}
          placeholder="https://vk.com/id" 
          className="text-foreground" 
         />
        </div>
        <div className="space-y-2">
         <Label htmlFor="telegram" className="text-foreground font-medium">Telegram</Label>
         <Input 
          id="telegram" 
          name="contacts.telegram" 
          value={newPlayerData.contacts.telegram}
          onChange={handleDialogInputChange}
          placeholder="@username" 
          className="text-foreground" 
         />
        </div>
        <div className="space-y-2">
         <Label htmlFor="faceit" className="text-foreground font-medium">Faceit</Label>
         <Input 
          id="faceit" 
          name="contacts.faceit" 
          value={newPlayerData.contacts.faceit}
          onChange={handleDialogInputChange}
          placeholder="https://www.faceit.com/en/players/" 
          className="text-foreground" 
         />
        </div>
        <div className="space-y-2">
         <Label htmlFor="steam" className="text-foreground font-medium">Steam</Label>
         <Input 
          id="steam" 
          name="contacts.steam" 
          value={newPlayerData.contacts.steam}
          onChange={handleDialogInputChange}
          placeholder="https://steamcommunity.com/id/" 
          className="text-foreground" 
         />
        </div>
       </div>
      </TabsContent>
      
      <TabsContent value="communication">
       <div className="space-y-4 py-2">
        <div className="space-y-2">
         <Label htmlFor="communicationLine" className="text-foreground font-medium">Communication line</Label>
         <Textarea 
          id="communicationLine" 
          value={newPlayerData.communicationLine}
          onChange={handleDialogCommunicationChange}
          placeholder="Enter the player communication line..."
          rows={5}
          className="text-foreground"
         />
        </div>
       </div>
      </TabsContent>
      
      <TabsContent value="development">
       <div className="space-y-4 py-2">
        <div className="space-y-2">
         <Label className="text-foreground font-medium">Roadmap</Label>
         <div className="flex items-center">
          <Button 
           variant="outline" 
           type="button" 
           className="w-full"
           onClick={() => handleDialogFileClick('roadmap')}
          >
           <Upload className="h-4 w-4 mr-2" />
           {dialogRoadmapFile ? 'Change Roadmap' : 'Upload roadmap'}
          </Button>
         </div>
         {dialogRoadmapFile && (
          <p className="text-sm text-muted-foreground">
           Selected file: {dialogRoadmapFile.name}
          </p>
         )}
        </div>
        <div className="space-y-2">
         <Label className="text-foreground font-medium">Mindmap</Label>
         <div className="flex items-center">
          <Button 
           variant="outline" 
           type="button" 
           className="w-full"
           onClick={() => handleDialogFileClick('mindmap')}
          >
           <Upload className="h-4 w-4 mr-2" />
           {dialogMindmapFile ? 'Change Mindmap' : 'Upload mind map'}
          </Button>
         </div>
         {dialogMindmapFile && (
          <p className="text-sm text-muted-foreground">
           Selected file: {dialogMindmapFile.name}
          </p>
         )}
        </div>
       </div>
      </TabsContent>
     </Tabs>
     
     <div className="flex justify-end space-x-2">
      <Button 
       variant="secondary" 
       onClick={() => setShowAddPlayerDialog(false)}
       className="text-foreground hover:bg-secondary/90 border border-input"
       disabled={isDialogSubmitting}
      >
       Cancel
      </Button>
      <Button 
       type="button" 
       onClick={handlePlayerAdded} 
       className="bg-primary hover:bg-primary/90"
       disabled={isDialogSubmitting}
      >
       {isDialogSubmitting ? (
        <>
         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
         Creating...
        </>
       ) : (
        <>
         <Plus className="h-4 w-4 mr-2" />
         Create карточку player
        </>
       )}
      </Button>
     </div>
   
   {/* Скрытые инпуты для загрузки файлов */}
   <input
    type="file"
    ref={roadmapFileRef}
    style={{ display: "none" }}
    accept="image/*"
    onChange={handleRoadmapChange}
   />
   <input
    type="file"
    ref={mindmapFileRef}
    style={{ display: "none" }}
    accept="image/*"
    onChange={handleMindmapChange}
   />
     
     {/* Скрытые инпуты для загрузки файлов в диалоге */}
     <input
      type="file"
      ref={dialogRoadmapRef}
      style={{ display: "none" }}
      accept="image/*"
      onChange={handleDialogRoadmapChange}
     />
     <input
      type="file"
      ref={dialogMindmapRef}
      style={{ display: "none" }}
      accept="image/*"
      onChange={handleDialogMindmapChange}
     />
    </DialogContent>
   </Dialog>

   {/* Диалог привязки player к карточке */}
   <Dialog open={showAttachPlayerDialog} onOpenChange={setShowAttachPlayerDialog}>
    <DialogContent className="sm:max-w-lg">
     <DialogHeader>
      <DialogTitle className="text-primary text-xl">Link player to card</DialogTitle>
      <DialogDescription className="text-foreground">
       Choose an existing card and player to link
      </DialogDescription>
     </DialogHeader>
     
     {loadingAttachDialog ? (
      <div className="flex items-center justify-center py-8">
       <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
       <span>Loading data...</span>
      </div>
     ) : (
      <>
       <div className="space-y-4 py-2">
        <div className="space-y-2">
         <Label htmlFor="cardSelect" className="text-foreground font-medium">
          Choose card ({availableCards.length} доступно)
         </Label>
         <Select value={selectedCardForAttach} onValueChange={setSelectedCardForAttach}>
          <SelectTrigger>
           <SelectValue placeholder="Choose a card to link" />
          </SelectTrigger>
          <SelectContent>
           {availableCards.length === 0 ? (
            <SelectItem value="no-cards" disabled>
             No доступных карточек
            </SelectItem>
           ) : (
            availableCards.map((card) => (
             <SelectItem key={card._id} value={card._id}>
              {card.user ? card.user.name : 'Card without player'} ({card.contacts?.nickname || 'No nickname'})
             </SelectItem>
            ))
           )}
          </SelectContent>
         </Select>
        </div>
        
        <div className="space-y-2">
         <Label htmlFor="playerSelect" className="text-foreground font-medium">
          Select player ({availablePlayersForAttach.length} доступно)
         </Label>
         <Select value={selectedPlayerForAttach} onValueChange={setSelectedPlayerForAttach}>
          <SelectTrigger>
           <SelectValue placeholder="Select a player to link" />
          </SelectTrigger>
          <SelectContent>
           {availablePlayersForAttach.length === 0 ? (
            <SelectItem value="no-players" disabled>
             No players без карточек
            </SelectItem>
           ) : (
            availablePlayersForAttach.map((player) => (
             <SelectItem key={player.id} value={player.id}>
              {player.name} ({player.email})
             </SelectItem>
            ))
           )}
          </SelectContent>
         </Select>
        </div>
        
        {/* Отладочная информация (можно удалить в продакшене) */}
        {process.env.NODE_ENV === 'development' && (
         <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <div className="font-semibold mb-1">Debug information:</div>
          <div>• Available cards: {availableCards.length}</div>
          <div>• Players without cards: {availablePlayersForAttach.length}</div>
          <div>• Total players в системе: {players.length}</div>
          {availablePlayersForAttach.length > 0 && (
           <div className="mt-2">
            <div className="font-semibold">Players without cards:</div>
            {availablePlayersForAttach.map(p => (
             <div key={p.id} className="ml-2">• {p.name} (ID: {p.id})</div>
            ))}
           </div>
          )}
          {availableCards.length > 0 && (
           <div className="mt-2">
            <div className="font-semibold">Available cards:</div>
            {availableCards.slice(0, 3).map(card => (
             <div key={card._id} className="ml-2">
              • {card.user?.name || 'Unnamed'} ({card.contacts?.nickname || 'No nickname'})
             </div>
            ))}
            {availableCards.length > 3 && (
             <div className="ml-2">... and {availableCards.length - 3}</div>
            )}
           </div>
          )}
         </div>
        )}
       </div>
       
       <div className="flex justify-end space-x-2">
        <Button 
         variant="secondary" 
         onClick={() => {
          setShowAttachPlayerDialog(false);
          setSelectedCardForAttach("");
          setSelectedPlayerForAttach("");
         }}
         className="text-foreground hover:bg-secondary/90 border border-input"
         disabled={attachingPlayer}
        >
         Cancel
        </Button>
        <Button 
         type="button" 
         onClick={handleAttachPlayer} 
         className="bg-primary hover:bg-primary/90"
         disabled={attachingPlayer || !selectedCardForAttach || !selectedPlayerForAttach || availableCards.length === 0 || availablePlayersForAttach.length === 0}
        >
         {attachingPlayer ? (
          <>
           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           Linking...
          </>
         ) : (
          <>
           <Link className="h-4 w-4 mr-2" />
           Link player
          </>
         )}
        </Button>
       </div>
      </>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default PlayerCardPage; 
