import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function App() {
  return (
    <div className="min-h-screen text-foreground p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">AI Theme Engine</h1>
          <p className="text-muted">Glassmorphism Design System</p>
        </div>

        <Card className="glass overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">User Authentication</CardTitle>
            <CardDescription className="text-muted">
              This is how your components will look inside the glass effect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <Input id="email" type="email" placeholder="agent@example.com" className="bg-background/50 border-white/10" />
            </div>
            <Button className="w-full shadow-lg shadow-primary/20">
              Initialize System
            </Button>
          </CardContent>
        </Card>
        
        <div className="glass-strong p-6 mt-6 rounded-2xl flex items-center justify-between">
           <div>
             <h3 className="font-medium text-lg mb-1">Strong Glass</h3>
             <p className="text-muted text-sm">A stronger blur applied for modal or prominent elements.</p>
           </div>
           <Button variant="secondary">View Details</Button>
        </div>
      </div>
    </div>
  );
}
