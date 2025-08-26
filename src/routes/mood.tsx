import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_ICONS } from "@/constants/moods";
import { MoodEntry, addMoodEntry, getTodaysMoodEntry } from "@/lib/database";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Heart, Meh } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

const EMOTIONS = [
  "Feliz",
  "Triste",
  "Ansiosa",
  "Calma",
  "Animada",
  "Cansada",
  "Grata",
  "Estressada",
  "Contente",
  "Frustrada",
  "Esperançosa",
  "Sobrecarregada",
];

export const Route = createFileRoute("/mood")({
  component: Mood,
});

export function Mood() {
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [note, setNote] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTodaysMood();
  }, []);

  const loadTodaysMood = async () => {
    try {
      const mood = await getTodaysMoodEntry();
      if (mood) {
        setTodaysMood(mood);
        setSelectedMood(mood.mood);
        setNote(mood.note || "");
        setSelectedEmotions(mood.emotions || []);
      }
    } catch (error) {
      console.error("Error loading mood:", error);
    }
  };

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addMoodEntry({
        mood: selectedMood,
        note: note.trim(),
        emotions: selectedEmotions,
      });

      await loadTodaysMood();

      toast("Humor registrado! ✨", {
        description:
          "Obrigado por reservar um tempo para se conectar consigo mesma.",
      });
    } catch (error) {
      toast("Erro", {
        description:
          "Falha ao salvar seu registro de humor. Por favor, tente novamente.",
      });
      console.error("Error saving mood entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodGradient = (moodValue: number) => {
    const gradients = [
      "from-red-500 to-red-600",
      "from-orange-500 to-orange-600",
      "from-yellow-500 to-yellow-600",
      "from-green-500 to-green-600",
      "from-emerald-500 to-emerald-600",
    ];
    return gradients[moodValue - 1] || gradients[2];
  };

  return (
    <div className="space-y-6 bg-grad">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Como você está se sentindo?
        </h2>
        <p className="text-muted-foreground">
          {todaysMood
            ? `Você registrou seu humor hoje às ${format(
                todaysMood.date,
                "h:mm a"
              )}`
            : "Reserve um momento para se conectar consigo mesma."}
        </p>
      </div>

      <Card className="shadow-wellness border-wellness-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-wellness-purple" />
            Check in de humor diário.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Scale */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-foreground">
              Avalie seu humor geral
            </label>
            <div className="flex justify-between items-center gap-2">
              {MOOD_ICONS.map((mood, index) => {
                const moodValue = index + 1;
                const Icon = mood.icon;
                const isSelected = selectedMood === moodValue;

                return (
                  <button
                    key={moodValue}
                    onClick={() => setSelectedMood(moodValue)}
                    className={twMerge(
                      "flex flex-1 flex-col items-center p-2 rounded-lg transition-all duration-200 ",
                      isSelected
                        ? "bg-gradient-wellness text-white shadow-wellness"
                        : `hover:bg-accent hover:${mood.color}`
                    )}
                  >
                    <Icon
                      className={`size-6 ${
                        isSelected ? "text-white" : mood.color
                      }`}
                    />
                    <span className="text-xs mt-1 ">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotions */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-foreground">
              Quais emoções você está sentindo? (opcional)
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {EMOTIONS.map((emotion) => (
                <Badge
                  key={emotion}
                  variant={
                    selectedEmotions.includes(emotion) ? "default" : "outline"
                  }
                  className={twMerge(
                    "cursor-pointer transition-all duration-200 ",
                    selectedEmotions.includes(emotion)
                      ? "bg-wellness-rose text-white shadow-soft"
                      : "hover:bg-accent"
                  )}
                  onClick={() => handleEmotionToggle(emotion)}
                >
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Notas (opcional)
            </label>
            <Textarea
              placeholder="O que está em sua mente? Como foi seu dia?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border-wellness-blue/30 focus:border-wellness-blue resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="wellness"
            className="w-full"
          >
            {isSubmitting
              ? "Salvando..."
              : todaysMood
              ? "Atualizar Humor"
              : "Registrar Humor"}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {todaysMood && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Resumo de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const MoodIcon = MOOD_ICONS[todaysMood.mood - 1]?.icon || Meh;
                  return (
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-r ${getMoodGradient(
                        todaysMood.mood
                      )}`}
                    >
                      <MoodIcon className="h-6 w-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <p className="font-medium">
                    {MOOD_ICONS[todaysMood.mood - 1]?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Registrado em {format(todaysMood.date, "h:mm a")}
                  </p>
                </div>
              </div>

              {todaysMood.emotions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Emoções:</p>
                  <div className="flex flex-wrap gap-1">
                    {todaysMood.emotions.map((emotion) => (
                      <Badge
                        key={emotion}
                        variant="secondary"
                        className="text-xs"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {todaysMood.note && (
                <div>
                  <p className="text-sm font-medium mb-2">Notas:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {todaysMood.note}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
