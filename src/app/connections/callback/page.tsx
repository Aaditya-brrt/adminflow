"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { integrationsService } from "@/lib/service/integrations";

function ConnectionCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [connectionData, setConnectionData] = useState<any>(null);

  useEffect(() => {
    const connectionId = searchParams.get('connectionId');
    
    if (!connectionId) {
      setStatus('error');
      setMessage('No connection ID provided');
      return;
    }

    checkConnectionStatus(connectionId);
  }, [searchParams]);

  const checkConnectionStatus = async (connectionId: string) => {
    try {
      const connection = await integrationsService.checkConnectionStatus(connectionId);
      
      if (connection.status === 'active') {
        setStatus('success');
        setMessage('Connection established successfully!');
        setConnectionData(connection);
      } else {
        setStatus('error');
        setMessage(`Connection failed: ${connection.status}`);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setStatus('error');
      setMessage('Failed to verify connection status');
    }
  };

  const handleContinue = () => {
    router.push('/integrations');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          )}
          
          <CardTitle>
            {status === 'loading' && 'Connecting...'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'loading' && 'Please wait while we establish your connection...'}
            {status === 'success' && 'Your integration has been connected successfully.'}
            {status === 'error' && 'There was an issue connecting your integration.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}
          
          {connectionData && status === 'success' && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Connection Details</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Status: {connectionData.status}</p>
                <p>Service: {connectionData.authConfig?.toolkit}</p>
                <p>ID: {connectionData.id}</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            {status === 'success' && (
              <Button onClick={handleContinue} className="flex-1">
                Continue to Integrations
              </Button>
            )}
            
            {status === 'error' && (
              <>
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleContinue} className="flex-1">
                  Back to Integrations
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectionCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Preparing connection callback...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <ConnectionCallbackContent />
    </Suspense>
  );
} 