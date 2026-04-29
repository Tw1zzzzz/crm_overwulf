import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, Shield, Users, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { updatePrivilegeKey } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface StaffPrivilegeUpgradeProps {
 onUpgradeSuccess?: () => void;
 className?: string;
}

/**
 * Компонент для повышения привилегий staff user
 * Позволяет вводить код доступа и получать расширенные права
 */
const StaffPrivilegeUpgrade: React.FC<StaffPrivilegeUpgradeProps> = ({
 onUpgradeSuccess,
 className = ''
}) => {
 const { user, refreshUser } = useAuth();
 const [accessCode, setAccessCode] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [isSuccess, setIsSuccess] = useState(false);

 // Проверяем, есть ли уже привилегии
 const hasPrivileges = user?.privilegeKey && user.privilegeKey.trim() !== '';

 const handleSubmitCode = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!accessCode.trim()) {
   setError('Enter access code');
   return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
   console.log('Sending access code to upgrade privileges...');
   
   const response = await updatePrivilegeKey(accessCode);
   
   if (response.success) {
    setIsSuccess(true);
    setAccessCode('');
    toast.success('Privileges activated. You can now manage staff and players.');
    
    // Обновляем данные user
    await refreshUser();
    
    // Вызываем callback если передан
    if (onUpgradeSuccess) {
     onUpgradeSuccess();
    }
   } else {
    setError(response.message || 'Invalid access code');
    toast.error('Invalid access code');
   }
  } catch (err: any) {
   console.error('Error while upgrading privileges:', err);
   setError(err.message || 'An error occurred while checking the code');
   toast.error('Error while checking access code');
  } finally {
   setIsSubmitting(false);
  }
 };

 // Если уже есть привилегии, показываем статус
 if (hasPrivileges) {
  return (
   <Card className={`border-green-200 bg-green-50 ${className}`}>
    <CardHeader className="pb-3">
     <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
       <Shield className="h-5 w-5 text-green-600" />
       <CardTitle className="text-green-800">Privileged access</CardTitle>
      </div>
      <Badge variant="default" className="bg-green-600">
       Active
      </Badge>
     </div>
     <CardDescription className="text-green-700">
      You have extended permissions to manage staff and players
     </CardDescription>
    </CardHeader>
    <CardContent>
     <div className="flex items-center space-x-4 text-sm text-green-700">
      <div className="flex items-center space-x-1">
       <Users className="h-4 w-4" />
       <span>Player management</span>
      </div>
      <div className="flex items-center space-x-1">
       <UserCog className="h-4 w-4" />
       <span>Staff management</span>
      </div>
     </div>
    </CardContent>
   </Card>
  );
 }

 return (
  <Card className={className}>
   <CardHeader>
    <div className="flex items-center space-x-2">
     <Key className="h-5 w-5 text-blue-600" />
     <CardTitle>Get privileged access</CardTitle>
    </div>
    <CardDescription>
     Enter access code для получения расширенных прав управления
    </CardDescription>
   </CardHeader>
   <CardContent>
    {isSuccess && (
     <Alert className="mb-4 border-green-200 bg-green-50">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
       Privileges activated. Reload the page to apply changes.
      </AlertDescription>
     </Alert>
    )}

    {error && (
     <Alert className="mb-4 border-red-200 bg-red-50">
      <AlertDescription className="text-red-800">
       {error}
      </AlertDescription>
     </Alert>
    )}

    <form onSubmit={handleSubmitCode} className="space-y-4">
     <div>
      <Input
       type="password"
       placeholder="Enter access code"
       value={accessCode}
       onChange={(e) => setAccessCode(e.target.value)}
       disabled={isSubmitting}
       className="font-mono"
      />
     </div>
     
     <Button 
      type="submit" 
      disabled={isSubmitting || !accessCode.trim()}
      className="w-full"
     >
      {isSubmitting ? 'Checking...' : 'Activate privileges'}
     </Button>
    </form>

    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
     <h4 className="text-sm font-medium text-blue-800 mb-2">
      What дают привилегии:
     </h4>
     <ul className="text-xs text-blue-700 space-y-1">
      <li>• Manage team staff roster</li>
      <li>• Add and remove players</li>
      <li>• Access extended analytics</li>
      <li>• Grant privileges to other staff members</li>
     </ul>
    </div>
   </CardContent>
  </Card>
 );
};

export default StaffPrivilegeUpgrade; 