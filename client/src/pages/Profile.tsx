import React from 'react';
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

/** Preview-only profile until auth and editable prefs ship. */
export default function Profile() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Preview profile for local MVP. Editing and real activity will arrive with authentication.
      </p>

      <Card className="mb-6">
        <CardHeader className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage alt="User Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">Fashion Enthusiast</h2>
            <p className="text-muted-foreground">Local demo user</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Style Preferences</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Casual</span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Minimalist</span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Vintage</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Favorite Colors</h3>
              <div className="flex gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500" title="Blue"></span>
                <span className="w-6 h-6 rounded-full bg-green-500" title="Green"></span>
                <span className="w-6 h-6 rounded-full bg-purple-600" title="Purple"></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
