// Componente per una singola colonna di categoria
  const UserCategoryColumn = ({ title, users: categoryUsers, bgColor, titleColor }: {
    title: string;
    users: any[];
    bgColor: string;
    titleColor: string;
  }) => (
    <Card className="h-fit">
      <CardHeader className={`${bgColor} text-white`}>
        <CardTitle className="text-center">
          {title} ({categoryUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {categoryUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nessun {title.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {categoryUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-medium">{user.code}</div>
                  <Badge variant={
                    user.status === 'approved' ? 'default' : 
                    user.status === 'pending' ? 'secondary' : 
                    'destructive'
                  }>
                    {user.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <div><strong>Nome:</strong> {user.assignedTo || 'N/A'}</div>
                  <div><strong>Provincia:</strong> {user.location || 'N/A'}</div>
                </div>

                {/* Note Interne */}
                <div className="mb-3">
                  {editingNote === user.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Aggiungi nota interna..."
                        className="min-h-16 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveNote}>Salva</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingNote}>Annulla</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-gray-600 flex-1">
                        <strong>Note:</strong> {user.internalNote || "Nessuna nota"}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingNote(user.id, user.internalNote)}
                        className="h-6 w-6 p-0"
                      >
                        <StickyNote size={12} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Azioni */}
                <div className="flex flex-wrap gap-1">
                  {user.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                        onClick={() => updateUserStatus(user.id, 'approve')}
                      >
                        ✅
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                        onClick={() => updateUserStatus(user.id, 'block')}
                      >
                        🚫
                      </Button>
                    </>
                  )}
                  {user.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 hover:bg-orange-50 text-xs px-2 py-1"
                      onClick={() => updateUserStatus(user.id, 'block')}
                    >
                      🚫
                    </Button>
                  )}
                  {user.status === 'blocked' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50 text-xs px-2 py-1"
                      onClick={() => updateUserStatus(user.id, 'approve')}
                    >
                      ✅
                    </Button>
                  )}
                  {user.role === 'partner' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                      onClick={() => bypassOnboarding(user.id)}
                      title="Bypass onboarding per test"
                    >
                      🚀
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                    onClick={() => moveToTrash(user.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users size={20} />
        <h2 className="text-xl font-semibold">Gestione Utenti ({users.length} totali)</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserCategoryColumn 
          title="Partner Commerciali"
          users={partnerUsers}
          bgColor="bg-orange-500"
          titleColor="text-orange-500"
        />
        <UserCategoryColumn 
          title="Strutture Ricettive"
          users={structureUsers}
          bgColor="bg-blue-500"
          titleColor="text-blue-500"
        />
        <UserCategoryColumn 
          title="Turisti"
          users={touristUsers}
          bgColor="bg-green-500"
          titleColor="text-green-500"
        />
      </div>
    </div>
  );