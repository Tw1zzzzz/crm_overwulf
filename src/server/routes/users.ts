import express from 'express';
import User from '../models/User';
import MoodEntry from '../models/MoodEntry';
import SleepEntry from '../models/SleepEntry';
import TestEntry from '../models/TestEntry';
import PlayerRating from '../models/PlayerRating';
import { protect, isStaff, hasPrivilegeKey } from '../middleware/auth';
import {
 buildVisiblePlayersFilter,
 findAccessiblePlayerById,
 getScopedTeamId,
 isTeamStaffUser,
} from '../utils/teamAccess';
import { applyActiveProfileProjection, getUserProfiles } from '../utils/userProfiles';

const router = express.Router();

// Get all players (staff only)
router.get('/players', protect, isStaff, async (req: any, res) => {
 try {
  console.log('Fetching all players');
  const players = await User.find(buildVisiblePlayersFilter(req.user))
   .select('name email role playerType completedTests completedBalanceWheel createdAt')
   .sort({ createdAt: -1 });

  console.log(`Found ${players.length} players`);
  return res.json(players);
 } catch (error) {
  console.error('Error fetching players:', error);
  return res.status(500).json({ message: 'Server error' });
 }
});

// Get player statistics (staff only)
router.get('/players/:id/stats', protect, isStaff, async (req: any, res) => {
 try {
  console.log('Fetching stats for player:', req.params.id);
  const player = await findAccessiblePlayerById(
   req.user,
   req.params.id,
   'name email playerType completedTests completedBalanceWheel createdAt'
  );

  if (!player) {
   console.log('Player not found:', req.params.id);
   return res.status(404).json({ message: 'Player not found' });
  }

  // Р”РѕР±Р°РІЏРµРј РїРѕѓС‡РµРЅµ РґР°РЅРЅС‹С… Рѕ РЅР°СЃС‚СЂРѕРµРЅё Рё СЌРЅРµСЂРіё
  const moodEntries = await MoodEntry.find({ userId: player._id })
   .sort({ date: -1 });
  
  // Р”РѕР±Р°РІЏРµРј РїРѕѓС‡РµРЅµ РґР°РЅРЅС‹С… Рѕ С‚РµСЃС‚Р°С…
  const testEntries = await TestEntry.find({ userId: player._id })
   .sort({ date: -1 });
  const sleepEntries = await SleepEntry.find({ userId: player._id })
   .sort({ date: -1 });

  // Р¤РѕСЂРјРёСЂСѓРµРј РѕР±СЉРµРєС‚ СЃ РїРѕЅРѕР№ СЃС‚Р°С‚РёСЃС‚єРѕР№ іСЂРѕРєР°
  const playerData = {
   _id: player._id,
   name: player.name,
   email: player.email,
   playerType: player.playerType,
   completedTests: player.completedTests,
   completedBalanceWheel: player.completedBalanceWheel,
   createdAt: player.createdAt,
   moodEntries,
   sleepEntries,
   testEntries
  };

  console.log('Player stats found with details:', player._id);
  return res.json(playerData);
 } catch (error) {
  console.error('Error fetching player stats:', error);
  return res.status(500).json({ message: 'Server error' });
 }
});

// Delete a player (only basic user data)
router.delete('/players/:id', protect, isStaff, hasPrivilegeKey, async (req: any, res) => {
 try {
  const { id } = req.params;
  
  if (!id || id === 'undefined' || id === 'null') {
   return res.status(400).json({ message: 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ ID іСЂРѕРєР°' });
  }
  
  console.log(`Attempting to delete player with ID: ${id}`);
  
  // РџСЂРѕРІРµСЂСЏРµРј, СЃСѓС‰РµСЃС‚РІСѓРµС‚ ё іСЂРѕРє
  const player = await findAccessiblePlayerById(req.user, id);
  if (!player) {
   return res.status(404).json({ message: 'РРіСЂРѕРє РЅРµ РЅР°Р№РґРµРЅ' });
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ СѓРґР°ЏРµРјС‹Р№ РїРѕЊР·РѕРІР°С‚РµЊ јРµРµС‚ СЂРѕЊ 'player'
  if (player.role !== 'player') {
   return res.status(400).json({ message: 'РњРѕР¶РЅРѕ СѓРґР°ЏС‚СЊ С‚РѕЊРєРѕ іСЂРѕРєРѕРІ' });
  }
  
  // РЈРґР°ЏРµРј РїРѕЊР·РѕРІР°С‚РµЏ
  await User.findByIdAndDelete(id);
  
  return res.json({ message: 'РРіСЂРѕРє СѓСЃРїРµС€РЅРѕ СѓРґР°µРЅ' });
 } catch (error) {
  console.error('Error deleting player:', error);
  return res.status(500).json({ message: 'Server error' });
 }
});

// Update player status (staff only)
router.patch('/players/:id/status', protect, isStaff, async (req: any, res) => {
 try {
  console.log('Updating status for player:', req.params.id);
  const { completedTests, completedBalanceWheel } = req.body;
  const player = await findAccessiblePlayerById(req.user, req.params.id);
  
  if (!player) {
   console.log('Player not found for status update:', req.params.id);
   return res.status(404).json({ message: 'Player not found' });
  }

  if (player.role !== 'player') {
   console.log('Attempted to update status of non-player user:', req.params.id);
   return res.status(400).json({ message: 'Can only update players' });
  }

  player.completedTests = completedTests;
  player.completedBalanceWheel = completedBalanceWheel;
  await player.save();

  console.log('Player status updated successfully:', req.params.id);
  return res.json(player);
 } catch (error) {
  console.error('Error updating player status:', error);
  return res.status(500).json({ message: 'Server error' });
 }
});

// Cascade delete a player and all related data
router.delete('/players/:id/complete', protect, isStaff, hasPrivilegeKey, async (req, res) => {
 try {
  const { id } = req.params;
  
  if (!id || id === 'undefined' || id === 'null') {
   return res.status(400).json({ message: 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ ID іСЂРѕРєР°' });
  }
  
  console.log(`[CASCADE DELETE] Attempting to delete player with ID: ${id} and all related data`);
  
  // РџСЂРѕРІРµСЂСЏРµРј, СЃСѓС‰РµСЃС‚РІСѓРµС‚ ё іСЂРѕРє
  const player = await findAccessiblePlayerById(req.user, id);
  if (!player) {
   return res.status(404).json({ message: 'РРіСЂРѕРє РЅРµ РЅР°Р№РґРµРЅ' });
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ СѓРґР°ЏРµРјС‹Р№ РїРѕЊР·РѕРІР°С‚РµЊ јРµРµС‚ СЂРѕЊ 'player'
  if (player.role !== 'player') {
   return res.status(400).json({ message: 'РњРѕР¶РЅРѕ СѓРґР°ЏС‚СЊ С‚РѕЊРєРѕ іСЂРѕРєРѕРІ' });
  }
  
  // РЈРґР°ЏРµРј РІСЃРµ СЃРІСЏР·Р°РЅРЅС‹Рµ РґР°РЅРЅС‹Рµ
  console.log(`[CASCADE DELETE] Deleting mood entries for player: ${id}`);
  await MoodEntry.deleteMany({ userId: id });
  
  console.log(`[CASCADE DELETE] Deleting test entries for player: ${id}`);
  await TestEntry.deleteMany({ userId: id });

  console.log(`[CASCADE DELETE] Deleting sleep entries for player: ${id}`);
  await SleepEntry.deleteMany({ userId: id });
  
  console.log(`[CASCADE DELETE] Deleting player ratings for player: ${id}`);
  await PlayerRating.deleteMany({ userId: id });
  
  // РЈРґР°ЏРµРј РїРѕЊР·РѕРІР°С‚РµЏ
  console.log(`[CASCADE DELETE] Deleting player: ${id}`);
  await User.findByIdAndDelete(id);
  
  return res.json({ 
   message: 'РРіСЂРѕРє Рё РІСЃРµ СЃРІСЏР·Р°РЅРЅС‹Рµ РґР°РЅРЅС‹Рµ СѓСЃРїРµС€РЅРѕ СѓРґР°µРЅС‹',
   deletedPlayerId: id,
   success: true
  });
 } catch (error) {
  console.error('[CASCADE DELETE] Error deleting player and related data:', error);
  return res.status(500).json({ 
   message: 'РћС€±РєР° РїСЂРё СѓРґР°µРЅё іСЂРѕРєР° Рё СЃРІСЏР·Р°РЅРЅС‹С… РґР°РЅРЅС‹С…',
   error: error.message
  });
 }
});

// Update privilege key (staff only)
router.post('/update-privilege-key', protect, isStaff, async (req: any, res) => {
 try {
  console.log('Updating privilege key for staff user:', req.user._id);
  const { privilegeKey } = req.body;

  // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РїРѕЊР·РѕРІР°С‚РµЊ РјРѕР¶РµС‚ РѕР±РЅРѕРІЏС‚СЊ С‚РѕЊРєРѕ СЃРІРѕР№ РєЋС‡ РїСЂІРёµРі№
  const userId = req.user._id;
  
  // РџРѕѓС‡Р°РµРј РєРѕСЂСЂРµРєС‚РЅС‹Р№ РєЋС‡ · РїРµСЂРµРјРµРЅРЅС‹С… РѕРєСЂСѓР¶РµРЅРёСЏ
  const validPrivilegeKey = process.env.STAFF_PRIVILEGE_KEY;
  
  // Р”РµС‚Р°ЊРЅРѕРµ ѕРіРёСЂРѕРІР°РЅµ РґЏ Рґ°РіРЅРѕСЃС‚єРё
  console.log('[PRIVILEGE DEBUG] NODE_ENV:', process.env.NODE_ENV);
  console.log('[PRIVILEGE DEBUG] STAFF_PRIVILEGE_KEY Р·Р°РіСЂСѓР¶РµРЅ · env:', !!process.env.STAFF_PRIVILEGE_KEY);
  console.log('[PRIVILEGE DEBUG] РСЃРїРѕЊР·СѓРµРјС‹Р№ РєЋС‡ (РїРµСЂРІС‹Рµ 10 СЃјРІРѕѕРІ):', validPrivilegeKey.substring(0, 10) + '...');
  console.log('[PRIVILEGE DEBUG] Р’СЃРµ env РїРµСЂРµРјРµРЅРЅС‹Рµ (STAFF_*):', Object.keys(process.env).filter(key => key.includes('STAFF')));
  
  if (!validPrivilegeKey) {
   console.error('[PRIVILEGE ERROR] STAFF_PRIVILEGE_KEY not configured and no fallback available');
   return res.status(500).json({ 
    message: 'РћС€±РєР° РєРѕРЅС„іСѓСЂР°С†ё СЃРµСЂРІРµСЂР°: РєЋС‡ РїСЂІРёµРі№ РЅРµ РЅР°СЃС‚СЂРѕРµРЅ',
    success: false 
   });
  }

  // РџСЂРѕРІРµСЂСЏРµРј РІРІРµРґРµРЅРЅС‹Р№ РєЋС‡ РїСЂІРёµРі№
  const isKeyValid = privilegeKey === validPrivilegeKey;
  
  console.log(`[PRIVILEGE] РџРѕРїС‹С‚РєР° РѕР±РЅРѕРІµРЅРёСЏ РєЋС‡Р° РґЏ ${req.user.name}`);
  console.log(`[PRIVILEGE] Р’РІРµРґРµРЅРЅС‹Р№ РєЋС‡: ${privilegeKey}`);
  console.log(`[PRIVILEGE] Р’Р°ёРґРЅС‹Р№ РєЋС‡: ${validPrivilegeKey}`);
  console.log(`[PRIVILEGE] РљЋС‡ РІР°ёРґРµРЅ: ${isKeyValid}`);
  
  // РћР±РЅРѕРІЏРµРј РєЋС‡ РїСЂІРёµРі№ С‚РѕЊРєРѕ РµСЃё РѕРЅ РІР°ёРґРЅС‹Р№
  if (isKeyValid) {
   const updatedUser = await User.findById(userId).select('-password');

   if (!updatedUser) {
    return res.status(404).json({ 
     message: 'РџРѕЊР·РѕРІР°С‚РµЊ РЅРµ РЅР°Р№РґРµРЅ',
     success: false 
    });
   }

   updatedUser.privilegeKey = privilegeKey;
   updatedUser.profiles = getUserProfiles(updatedUser).map((profile) =>
    profile.role === 'staff'
     ? {
       ...profile,
       privilegeKey,
      }
     : profile
   ) as any;
   applyActiveProfileProjection(updatedUser);
   await updatedUser.save();

   console.log('Privilege key updated successfully');
   return res.json({
    success: true,
    message: 'РљЋС‡ РїСЂІРёµРі№ СѓСЃРїРµС€РЅРѕ РѕР±РЅРѕРІµРЅ',
    user: {
     id: updatedUser._id,
     name: updatedUser.name,
     email: updatedUser.email,
     role: updatedUser.role,
     privilegeKey: updatedUser.privilegeKey,
     avatar: updatedUser.avatar,
     createdAt: updatedUser.createdAt
    }
   });
  } else {
   // Р•СЃё РєЋС‡ РЅРµРІРµСЂРЅС‹Р№, РІРѕР·РІСЂР°С‰Р°РµРј РѕС€±РєСѓ
   return res.status(400).json({
    success: false,
    message: 'РќРµРІРµСЂРЅС‹Р№ РєЋС‡ РїСЂІРёµРі№'
   });
  }
 } catch (error) {
  console.error('Error updating privilege key:', error);
  return res.status(500).json({ 
   message: 'Server error',
   success: false 
  });
 }
});

// Check if staff has privilege key
router.get('/check-privilege', protect, isStaff, async (req: any, res) => {
 try {
  const hasPrivilege = (isTeamStaffUser(req.user) && Boolean(getScopedTeamId(req.user))) ||
   Boolean(req.user && req.user.privilegeKey && req.user.privilegeKey.trim() !== '');
  
  return res.json({
   hasPrivilege,
   message: hasPrivilege 
    ? 'РЈ РІР°СЃ РµСЃС‚СЊ РґРѕСЃС‚СѓРї Рє СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЋ СЃРѕСЃС‚Р°РІР° СѓС‡Р°СЃС‚РЅєРѕРІ' 
    : 'РЈ РІР°СЃ РЅРµС‚ РґРѕСЃС‚СѓРїР° Рє СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЋ СЃРѕСЃС‚Р°РІР° СѓС‡Р°СЃС‚РЅєРѕРІ'
  });
 } catch (error) {
  console.error('Error checking privilege key:', error);
  return res.status(500).json({ message: 'Server error' });
 }
});

export default router; 
