"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash, Lightbulb } from "lucide-react";
import { FALLBACK_WORDS } from "@/lib/wordlist";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";

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

  // Extract known letter information from guesses
  const getKnownLetterInfo = (guesses: Guess[]) => {
    const correctPositions: Record<number, string> = {}; // position -> letter (green)
    const presentLetters = new Set<string>(); // letters known to be in word (yellow/green)
    const absentLetters = new Set<string>(); // letters known NOT to be in word (gray)
    const wrongPositions: Record<string, Set<number>> = {}; // letter -> positions where it's NOT (yellow)

    guesses.forEach((guess) => {
      guess.letters.forEach((letter, position) => {
        if (letter.state === "correct") {
          correctPositions[position] = letter.letter;
          presentLetters.add(letter.letter);
        } else if (letter.state === "present") {
          presentLetters.add(letter.letter);
          if (!wrongPositions[letter.letter]) {
            wrongPositions[letter.letter] = new Set();
          }
          wrongPositions[letter.letter].add(position);
        } else if (letter.state === "absent") {
          // Only mark as absent if this letter isn't also present/correct elsewhere in this guess
          const isElsewhereCorrectOrPresent = guess.letters.some((l, idx) => l.letter === letter.letter && idx !== position && (l.state === "correct" || l.state === "present"));
          if (!isElsewhereCorrectOrPresent) {
            absentLetters.add(letter.letter);
          }
        }
      });
    });

    return {
      correctPositions,
      presentLetters,
      absentLetters,
      wrongPositions,
    };
  };

  // Calculate letter frequencies from remaining possible words
  const calculateLetterFrequencies = (words: string[]): { letter: string; frequency: number; positionFreq: number[]; isVowel: boolean }[] => {
    const letterCounts: Record<string, number> = {};
    const positionCounts: Record<string, number[]> = {};
    const vowels = new Set(["A", "E", "I", "O", "U"]);

    words.forEach((word) => {
      const uniqueLetters = new Set(word);
      uniqueLetters.forEach((letter) => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        if (!positionCounts[letter]) {
          positionCounts[letter] = [0, 0, 0, 0, 0];
        }
        for (let i = 0; i < 5; i++) {
          if (word[i] === letter) {
            positionCounts[letter][i]++;
          }
        }
      });
    });

    return Object.keys(letterCounts).map((letter) => ({
      letter,
      frequency: letterCounts[letter],
      positionFreq: positionCounts[letter] || [0, 0, 0, 0, 0],
      isVowel: vowels.has(letter),
    }));
  };

  // Score a word based on letter frequency, position frequency, and known letter states
  const scoreWord = (
    word: string,
    frequencies: { letter: string; frequency: number; positionFreq: number[]; isVowel?: boolean }[],
    knownInfo: {
      correctPositions: Record<number, string>;
      presentLetters: Set<string>;
      absentLetters: Set<string>;
      wrongPositions: Record<string, Set<number>>;
    },
    remainingWords: string[]
  ): number => {
    let score = 0;
    const wordLetters = word.split("");
    const uniqueLetters = new Set(wordLetters);
    const vowels = new Set(["A", "E", "I", "O", "U"]);

    // CRITICAL: Disqualify words that violate known constraints
    // Check if word has any gray (absent) letters
    for (const letter of wordLetters) {
      if (knownInfo.absentLetters.has(letter)) {
        return -10000; // Strongly penalize/disqualify
      }
    }

    // CRITICAL: Must have all known present letters (yellow/green)
    const wordLetterSet = new Set(wordLetters);
    for (const requiredLetter of knownInfo.presentLetters) {
      if (!wordLetterSet.has(requiredLetter)) {
        return -10000; // Must contain all known present letters
      }
    }

    // CRITICAL: Check correct positions (green) - must match exactly
    for (const [positionStr, requiredLetter] of Object.entries(knownInfo.correctPositions)) {
      const position = Number(positionStr);
      if (wordLetters[position] !== requiredLetter) {
        return -10000; // Must match known correct positions
      }
    }

    // CRITICAL: Check wrong positions (yellow) - letter must be in word but NOT at these positions
    for (const [letter, wrongPosSet] of Object.entries(knownInfo.wrongPositions)) {
      if (wordLetterSet.has(letter)) {
        // Letter is in the word, check it's not at wrong positions
        for (const wrongPos of wrongPosSet) {
          if (wordLetters[wrongPos] === letter) {
            return -10000; // Letter can't be at this position
          }
        }
      }
    }

    // Prefer words with unique letters (no duplicates) - helps gather more information
    const uniqueLetterBonus = uniqueLetters.size === 5 ? 50 : 0;
    score += uniqueLetterBonus;

    // BIG BONUS: Use known present letters in NEW positions (helps narrow down)
    let newPositionBonus = 0;
    wordLetters.forEach((letter, position) => {
      if (knownInfo.presentLetters.has(letter)) {
        // This is a known letter - bonus if it's in a new position we haven't tried
        const wrongPos = knownInfo.wrongPositions[letter];
        if (!wrongPos || !wrongPos.has(position)) {
          // Check if this is a correct position already known
          if (knownInfo.correctPositions[position] !== letter) {
            newPositionBonus += 30; // Testing known letter in new position
          }
        }
      }
    });
    score += newPositionBonus;

    // Calculate letter frequency scores for unknown letters
    wordLetters.forEach((letter, position) => {
      const freqData = frequencies.find((f) => f.letter === letter);
      if (freqData) {
        // Base frequency score (but lower weight if we already know this letter)
        const isKnownLetter = knownInfo.presentLetters.has(letter);
        if (!isKnownLetter) {
          // New unknown letters are more valuable for gathering information
          score += freqData.frequency * 1.5;
        } else {
          score += freqData.frequency * 0.5; // Less valuable if we already know it
        }

        // Position frequency bonus
        score += freqData.positionFreq[position] * 2;

        // Bonus for vowels (especially if we haven't discovered many vowels yet)
        if (freqData.isVowel && !knownInfo.presentLetters.has(letter)) {
          score += 15;
        }
      }
    });

    // Vowel/consonant balance bonus
    const vowelCount = wordLetters.filter((l) => vowels.has(l)).length;
    if (vowelCount >= 2 && vowelCount <= 3) {
      score += 20;
    }

    // Early game: prefer common starting words
    if (remainingWords.length > 1000 && Object.keys(knownInfo.correctPositions).length === 0) {
      const commonStarters = ["CRANE", "SLATE", "REAST", "TRACE", "AUDIO"];
      if (commonStarters.includes(word)) {
        score += 100;
      }
    }

    return score;
  };

  // Suggest the best word to try
  const suggestBestWord = (): string | null => {
    if (possibleWords.length === 0) return "Not enough words to suggest";

    // If we have very few words left, just return the first one
    if (possibleWords.length <= 3) {
      return possibleWords[0].toUpperCase();
    }

    const knownInfo = getKnownLetterInfo(guesses);
    const frequencies = calculateLetterFrequencies(possibleWords);

    // Get all words from the dictionary that could help eliminate possibilities
    // For early guesses, use all words; for later guesses, prefer words from remaining possibilities
    // Limit to 5000 words max to avoid performance issues
    let wordsToConsider = possibleWords.length > 50 ? allWords : possibleWords;
    if (wordsToConsider.length > 5000) {
      wordsToConsider = wordsToConsider.slice(0, 5000);
    }

    // Score each word, filtering out invalid ones
    const scoredWords = wordsToConsider
      .map((word: string) => {
        const upperWord = word.toUpperCase();
        const score = scoreWord(upperWord, frequencies, knownInfo, possibleWords);
        return { word: upperWord, score };
      })
      .filter((item) => item.score > -5000); // Remove disqualified words

    // Sort by score (highest first) and return the best one
    scoredWords.sort((a, b) => b.score - a.score);

    return scoredWords.length > 0 ? scoredWords[0].word : null;
  };

  const suggestedWord = suggestBestWord();

  const getLetterStateColor = (state: LetterState) => {
    switch (state) {
      case "correct":
        return "bg-green-600 dark:bg-green-500 text-white";
      case "present":
        return "bg-amber-500 dark:bg-amber-400 text-white";
      case "absent":
        return "bg-gray-500 dark:bg-gray-600 text-white";
      default:
        return "bg-secondary text-secondary-foreground border-2 border-border";
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading word dictionary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1.5 pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">Enter your guesses and find the answer</h1>
            <p className="text-sm text-muted-foreground">Mark each letter as correct, wrong position, or not in word</p>
            <p className="text-xs text-muted-foreground/80">Using {allWords.length.toLocaleString()} words from dictionary</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add Your Guess</CardTitle>
              <CardDescription>Enter a 5-letter word you've tried in Wordle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 5-letter word"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().slice(0, 5))}
                  onKeyPress={(e) => e.key === "Enter" && addGuess()}
                  className="flex-1"
                  maxLength={5}
                />
                <Button onClick={() => addGuess()} disabled={currentGuess.length !== 5 || guesses.length >= 6}>
                  Add Guess
                </Button>
              </div>
              {guesses.length >= 6 && <p className="text-sm text-muted-foreground">Maximum 6 guesses reached</p>}
              {guesses.length < 6 && suggestedWord && suggestedWord === "Not enough words to suggest" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Suggested word:</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{suggestedWord}</span>
                    </p>
                  </div>
                  {/* <Button size="sm" variant="outline" onClick={() => addGuess(suggestedWord?.toLowerCase())} className="flex-shrink-0">
                    Use
                  </Button> */}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Suggested word:</p>
                    <p className="text-xs text-muted-foreground">
                      Try <span className="font-semibold text-primary">{suggestedWord}</span> to maximize information gain
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addGuess(suggestedWord?.toLowerCase())} className="flex-shrink-0">
                    Use
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {guesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Guesses</CardTitle>
                <CardDescription>Click each letter to mark it as correct (green), wrong position (yellow), or not in word (gray)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {guesses.map((guess) => (
                    <div key={guess.id} className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {guess.letters.map((letter, index) => (
                          <button
                            key={index}
                            onClick={() => toggleLetterState(guess.id, index)}
                            className={`w-14 h-14 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-sm ${getLetterStateColor(letter.state)}`}
                            title={getLetterStateLabel(letter.state)}
                          >
                            {letter.letter}
                          </button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeGuess(guess.id)} className="ml-2">
                        <Trash className="h-4 w-4 md:hidden" />
                        <span className="hidden md:block">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Possible Words ({possibleWords.length})</CardTitle>
              <CardDescription>Words that match your current constraints</CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(possibleWords) || possibleWords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No words match your current constraints. Check your guesses!</p>
              ) : possibleWords.length > 100 ? (
                <div>
                  <p className="text-foreground mb-4">Too many possibilities ({possibleWords.length} words). Add more guesses to narrow it down!</p>
                  <div className="flex flex-wrap gap-2">
                    {possibleWords.slice(0, 50).map((word) => (
                      <Badge key={word} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => addGuess(word)}>
                        {word}
                      </Badge>
                    ))}
                    <Badge variant="outline">+{possibleWords.length - 50} more...</Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {possibleWords.map((word) => (
                    <Badge key={word} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => addGuess(word)}>
                      {word}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advertising */}
          <div className="flex justify-center pt-4">
            <Link href="https://billoinvoicing.com?ref=wordle" target="_blank">
              <Image src="https://8yapdxq12w.ufs.sh/f/49awn2gt6CrDHhmSNePDk49QcmXUrROjMS3Zqip0KA5ef2th" alt="Billo Invoicing" width="500" height="50" className="rounded-lg" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
