"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash } from "lucide-react";
import { FALLBACK_WORDS } from "@/lib/wordlist";
import Link from "next/link";
import Image from "next/image";

type LetterState = "correct" | "present" | "absent" | "unknown";

interface GuessLetter {
  letter: string;
  state: LetterState;
}

interface Guess {
  id: string;
  letters: GuessLetter[];
}

export default function WordleHelper() {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://darkermango.github.io/5-Letter-words/words.json");
        if (!response.ok) {
          throw new Error("API not available");
        }
        const words = await response.json();
        if (Array.isArray(words.words) && words.words.length > 0) {
          setAllWords(words.words);
          setPossibleWords(words.words);
        } else {
          throw new Error("Invalid API response");
        }
        setError(null);
      } catch (err) {
        console.log("API failed, using fallback word list");
        setAllWords(FALLBACK_WORDS);
        setPossibleWords(FALLBACK_WORDS);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWords();
  }, []);

  const filterWords = (guesses: Guess[]) => {
    if (!Array.isArray(allWords)) return [];

    const filteredWords = allWords.filter((word) => {
      word = word.toUpperCase();
      // Track letter counts for "present" and "absent" logic
      let isValid = true;

      for (const guess of guesses) {
        // For each guess, build up letter state maps
        const correctLetters: Record<number, string> = {};
        const presentLetters: string[] = [];
        const absentLetters: string[] = [];

        // First, collect info from the guess
        guess.letters.forEach((guessLetter, idx) => {
          if (guessLetter.state === "correct") {
            correctLetters[idx] = guessLetter.letter;
          } else if (guessLetter.state === "present") {
            presentLetters.push(guessLetter.letter);
          } else if (guessLetter.state === "absent") {
            absentLetters.push(guessLetter.letter);
          }
        });

        // Check "correct" positions
        for (const idx in correctLetters) {
          if (word[Number(idx)] !== correctLetters[idx]) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;

        // Check "present" letters: must be in word, but NOT at that position
        guess.letters.forEach((guessLetter, idx) => {
          if (guessLetter.state === "present") {
            if (word[idx] === guessLetter.letter) {
              isValid = false;
            }
            if (!word.includes(guessLetter.letter)) {
              isValid = false;
            }
          }
        });
        if (!isValid) break;

        // For "absent" letters: must NOT be in word, UNLESS that letter is marked as "correct" or "present" elsewhere in this guess
        guess.letters.forEach((guessLetter, idx) => {
          if (guessLetter.state === "absent") {
            // If this letter is marked as "correct" or "present" elsewhere in this guess, allow it at those positions
            const isElsewhereCorrectOrPresent = guess.letters.some((l, i) => l.letter === guessLetter.letter && i !== idx && (l.state === "correct" || l.state === "present"));
            if (isElsewhereCorrectOrPresent) {
              // Only disallow at this position
              if (word[idx] === guessLetter.letter) {
                isValid = false;
              }
            } else {
              // Disallow anywhere in the word
              if (word.includes(guessLetter.letter)) {
                isValid = false;
              }
            }
          }
        });
        if (!isValid) break;
      }
      return isValid;
    });
    return filteredWords;
  };

  const addGuess = (word?: string) => {
    const guessWord = word || currentGuess;
    if (guessWord.length !== 5) return;

    const newGuess: Guess = {
      id: Date.now().toString(),
      letters: guessWord.split("").map((letter) => ({
        letter: letter.toUpperCase(),
        state: "unknown" as LetterState,
      })),
    };

    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setCurrentGuess("");
    setPossibleWords(filterWords(updatedGuesses));
  };

  const toggleLetterState = (guessId: string, letterIndex: number) => {
    const updatedGuesses = guesses.map((guess) => {
      if (guess.id === guessId) {
        const updatedLetters = guess.letters.map((letter, index) => {
          if (index === letterIndex) {
            const states: LetterState[] = ["unknown", "correct", "present", "absent"];
            const currentIndex = states.indexOf(letter.state);
            const nextIndex = (currentIndex + 1) % states.length;
            return { ...letter, state: states[nextIndex] };
          }
          return letter;
        });
        return { ...guess, letters: updatedLetters };
      }
      return guess;
    });

    setGuesses(updatedGuesses);
    setPossibleWords(filterWords(updatedGuesses));
  };

  const removeGuess = (guessId: string) => {
    const updatedGuesses = guesses.filter((guess) => guess.id !== guessId);
    setGuesses(updatedGuesses);
    setPossibleWords(filterWords(updatedGuesses));
  };

  const getLetterStateColor = (state: LetterState) => {
    switch (state) {
      case "correct":
        return "bg-[#6CA965] text-white";
      case "present":
        return "bg-[#c8b653] text-white";
      case "absent":
        return "bg-[#787c7f] text-white";
      default:
        return "bg-neutral-800 text-neutral-100";
    }
  };

  const getLetterStateLabel = (state: LetterState) => {
    switch (state) {
      case "correct":
        return "Correct position";
      case "present":
        return "Wrong position";
      case "absent":
        return "Not in word";
      default:
        return "Click to set";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-neutral-300">Loading word dictionary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">Wordle Helper</h1>
          <p className="text-neutral-300">Enter your guesses and mark each letter to find possible answers</p>
          <p className="text-sm text-neutral-400 mt-1">Using {allWords.length} words from dictionary</p>
        </div>

        <Card className="bg-neutral-900 text-neutral-100 border-neutral-800">
          <CardHeader>
            <CardTitle>Add Your Guess</CardTitle>
            <CardDescription className="text-neutral-400">Enter a 5-letter word you've tried in Wordle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter 5-letter word"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().slice(0, 5))}
                onKeyPress={(e) => e.key === "Enter" && addGuess()}
                className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                maxLength={5}
              />
              <Button
                onClick={() => addGuess()}
                disabled={currentGuess.length !== 5 || guesses.length >= 6}
                className="bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-700 disabled:text-neutral-400"
              >
                Add Guess
              </Button>
            </div>
            {guesses.length >= 6 && <p className="text-sm text-neutral-400 mt-2">Maximum 6 guesses reached</p>}
          </CardContent>
        </Card>

        {guesses.length > 0 && (
          <Card className="bg-neutral-900 text-neutral-100 border-neutral-800">
            <CardHeader>
              <CardTitle>Your Guesses</CardTitle>
              <CardDescription className="text-neutral-400">Click each letter to mark it as correct (green), wrong position (yellow), or not in word (gray)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guesses.map((guess) => (
                  <div key={guess.id} className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {guess.letters.map((letter, index) => (
                        <button
                          key={index}
                          onClick={() => toggleLetterState(guess.id, index)}
                          className={`w-12 h-12 rounded border-2 border-neutral-700 font-bold text-lg transition-colors ${getLetterStateColor(letter.state)}`}
                          title={getLetterStateLabel(letter.state)}
                        >
                          {letter.letter}
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeGuess(guess.id)} className="ml-2 bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700">
                      <Trash className="md:hidden" />
                      <span className="hidden md:block">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-neutral-900 text-neutral-100 border-neutral-800">
          <CardHeader>
            <CardTitle>Possible Words ({possibleWords.length})</CardTitle>
            <CardDescription className="text-neutral-400">Words that match your current constraints</CardDescription>
          </CardHeader>
          <CardContent>
            {!Array.isArray(possibleWords) || possibleWords.length === 0 ? (
              <p className="text-neutral-400 text-center py-4">No words match your current constraints. Check your guesses!</p>
            ) : possibleWords.length > 100 ? (
              <div>
                <p className="text-neutral-300 mb-4">Too many possibilities ({possibleWords.length} words). Add more guesses to narrow it down!</p>
                <div className="flex flex-wrap gap-2">
                  {possibleWords.slice(0, 50).map((word) => (
                    <Badge key={word} variant="secondary" className="cursor-pointer bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition-colors" onClick={() => addGuess(word)}>
                      {word}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                    +{possibleWords.length - 50} more...
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {possibleWords.map((word) => (
                  <Badge key={word} variant="secondary" className="cursor-pointer bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition-colors" onClick={() => addGuess(word)}>
                    {word}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Advertising */}
      <div className="flex justify-center mt-6 ">
        <Link href="https://billoinvoicing.com?ref=wordle" target="_blank">
          <Image src="https://8yapdxq12w.ufs.sh/f/49awn2gt6CrDHhmSNePDk49QcmXUrROjMS3Zqip0KA5ef2th" alt="Billo Invoicing" width="500" height="50" className="rounded-lg" />
        </Link>
      </div>
    </div>
  );
}
