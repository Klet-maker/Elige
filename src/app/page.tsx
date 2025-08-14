"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';


const TOTAL_NUMBERS = 50;

type NumberState = {
  id: number;
  isTaken: boolean;
  takenBy?: string;
};

export default function UniqueNumberSelector() {
  const [numbers, setNumbers] = useState<NumberState[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<NumberState | null>(null);
  const [takerName, setTakerName] = useState('');

  useEffect(() => {
    const numbersRef = ref(db, 'numbers');
    const unsubscribe = onValue(numbersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNumbers(data);
      } else {
        // Initialize if no data
        const initialNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => ({
          id: i + 1,
          isTaken: false,
          takenBy: '',
        }));
        set(numbersRef, initialNumbers);
        setNumbers(initialNumbers);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectNumber = (number: NumberState) => {
    if (!number.isTaken) {
      setSelectedNumber(number);
      setTakerName('');
    }
  };

  const handleConfirmSelection = () => {
    if (selectedNumber && takerName.trim()) {
      const numberRef = ref(db, `numbers/${selectedNumber.id - 1}`);
      set(numberRef, {
        ...selectedNumber,
        isTaken: true,
        takenBy: takerName.trim()
      });
      setSelectedNumber(null);
      setTakerName('');
    }
  };

  const handleCancelSelection = () => {
    setSelectedNumber(null);
    setTakerName('');
  };

  const { availableCount, takenCount, takenNumbers } = useMemo(() => {
    const taken = [];
    let available = 0;
    if (!numbers) {
        return { availableCount: 0, takenCount: 0, takenNumbers: [] };
    }
    for (const number of numbers) {
      if (number.isTaken) {
        taken.push(number);
      } else {
        available++;
      }
    }
    taken.sort((a,b) => a.id - b.id);
    return {
      availableCount: available,
      takenCount: taken.length,
      takenNumbers: taken
    };
  }, [numbers]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline tracking-tight sm:text-4xl">Selector de Números Únicos</CardTitle>
            <CardDescription className="mt-2 text-lg">Cargando números disponibles...</CardDescription>
            <div className="flex justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="w-24 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="w-20 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
              {Array.from({ length: 50 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square h-auto w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-4xl shadow-lg animate-in fade-in duration-500">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline tracking-tight sm:text-4xl">Selector de Números Únicos</CardTitle>
            <CardDescription className="mt-2 text-lg">
              Elige bien, porque solo tienes una oportunidad.
            </CardDescription>
            <div className="flex justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md border border-primary bg-primary/20"></div>
                <span className="text-sm font-medium text-muted-foreground">Disponibles: <span className="font-semibold text-foreground">{availableCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-destructive"></div>
                <span className="text-sm font-medium text-muted-foreground">Ocupados: <span className="font-semibold text-foreground">{takenCount}</span></span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 text-center">
              {numbers.map(number => (
                <Tooltip key={number.id} >
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleSelectNumber(number)}
                      disabled={number.isTaken}
                      variant={
                        number.isTaken
                          ? 'destructive'
                          : selectedNumber?.id === number.id
                          ? 'default'
                          : 'outline'
                      }
                      className={cn(
                        'aspect-square h-auto w-full p-0 text-lg font-bold transition-all duration-200 hover:scale-105',
                        selectedNumber?.id !== number.id && !number.isTaken && 'hover:bg-primary/20 hover:text-primary-foreground',
                        selectedNumber?.id === number.id && 'scale-105 ring-2 ring-ring ring-offset-background'
                      )}
                      aria-label={`Número ${number.id}, ${number.isTaken ? `ocupado por ${number.takenBy}` : 'disponible'}`}
                    >
                      {number.id}
                    </Button>
                  </TooltipTrigger>
                  {number.isTaken && number.takenBy && (
                    <TooltipContent>
                      <p>Ocupado por: {number.takenBy}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>

        {takenNumbers.length > 0 && (
          <Card className="w-full max-w-4xl shadow-lg mt-8 animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>Lista de personas que han seleccionado un número.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {takenNumbers.map((number) => (
                  <li key={number.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{number.takenBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">{number.id}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedNumber} onOpenChange={(isOpen) => !isOpen && handleCancelSelection()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline">Confirma tu Selección</DialogTitle>
              <DialogDescription className="pt-2">
                Has seleccionado el número <span className="font-bold text-foreground">{selectedNumber?.id}</span>. Por favor, ingresa tu nombre para confirmar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="inline-flex items-center justify-center bg-primary/10 text-primary-foreground rounded-full h-32 w-32 border-4 border-primary mx-auto">
                <span className="text-6xl font-bold">{selectedNumber?.id}</span>
              </div>
              <Input
                id="name"
                placeholder="Ingresa tu nombre"
                value={takerName}
                onChange={(e) => setTakerName(e.target.value)}
                className="mt-4"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelSelection}>Cancelar</Button>
              <Button onClick={handleConfirmSelection} disabled={!takerName.trim()}>
                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
