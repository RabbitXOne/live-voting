"use client"

import Image from "next/image";
import { useState, useEffect } from 'react';

import VoteButton from "@/components/custom/votebutton"
import { Vote } from "lucide-react";

export default function LiveVotingResults() {
    const [title, setTitle] = useState("");
    const [showFirstX, setShowFirstX] = useState(0);
    const [moreRedacted, setMoreRedacted] = useState("");
    const [tabTitle, setTabTitle] = useState("");
    const [footer, setFooter] = useState("");
    const [buttonSubtext, setButtonSubtext] = useState("");
    const [voteOptions, setVoteOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(true);

    useEffect(() => {
        fetch('/api/getlivesetup')
            .then(response => response.json())
            .then(data => {
                setTitle(data.title);
                setShowFirstX(data.showFirstX);
                setMoreRedacted(data.moreRedacted);
                setButtonSubtext(data.buttonSubtext);
                setTabTitle(data.tabTitle);
                setFooter(data.footer);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching setup data:', error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/api/getlive')
                .then(response => response.json())
                .then(data => {
                    setVoteOptions(data.options);
                })
                .catch(error => {
                    console.error('Error fetching live data:', error);
                });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    function parseLabel(label) {
        const regex = /<a\s+href=(['"])(.*?)\1>(.*?)<\/a>/g
        const parts = []
        let lastIndex = 0
        let match

        while ((match = regex.exec(label)) !== null) {
            if (match.index > lastIndex) {
                parts.push(label.substring(lastIndex, match.index))
            }
            parts.push(
                <a href={match[2]} key={match.index} className="text-gray-900 underline">
                    {match[3]}
                </a>
            )
            lastIndex = match.index + match[0].length
        }

        if (lastIndex < label.length) {
            parts.push(label.substring(lastIndex))
        }

        return parts
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#1e1e1e] relative">
            <title>{tabTitle}</title>
            {loading && (
                <div className={`preloader fixed inset-0 flex items-center justify-center bg-[#1e1e1e] ${fadeOut ? 'fade-out' : ''}`}>
                    <svg className="spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="2"></circle>
                    </svg>
                    <style jsx>{`
                        .fade-out {
                            animation: fade-out 0.2s ease-in-out;
                        }

                        @keyframes fade-out {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }

                        .spinner {
                            animation: rotate 2s linear infinite;
                            z-index: 2;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            margin: -25px 0 0 -25px;
                            width: 50px;
                            height: 50px;
                        }

                        .spinner .path {
                            stroke: hsl(138deg 0% 100%);
                            stroke-linecap: round;
                            animation: dash 1.5s ease-in-out infinite;
                        }

                        @keyframes rotate {
                            100% {
                                transform: rotate(360deg);
                            }
                        }

                        @keyframes dash {
                            0% {
                                stroke-dasharray: 1, 150;
                                stroke-dashoffset: 0;
                            }
                            50% {
                                stroke-dasharray: 90, 150;
                                stroke-dashoffset: -35;
                            }
                            100% {
                                stroke-dasharray: 90, 150;
                                stroke-dashoffset: -124;
                            }
                        }
                    `}</style>
                </div>
            )}
            {!loading && (
                <>
                    <div className="flex justify-center items-center mt-10">
                        <div className="border border-transparent max-w-[64rem] w-full p-6 text-center">
                            <Image
                                className="invert mx-auto"
                                src="/next.svg"
                                alt="Next.js logo"
                                width={180}
                                height={38}
                                priority
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                            />
                            <h2 id="title" className="mt-4 text-gray-200 break-words font-semibold">{title}</h2>
                            <div className="mt-12 flex flex-col items-center">
                                {(() => {
                                    const sortedOptions = [...voteOptions].sort((a, b) => b.votes - a.votes);
                                    const displayedOptions = sortedOptions.slice(0, showFirstX);
                                    const extraOptionsCount = sortedOptions.length - showFirstX;

                                    return (
                                        <>
                                            {displayedOptions.map((option, index) => (
                                                <VoteButton
                                                    key={index}
                                                    disabled={true}
                                                    color={option.color}
                                                    subtext={buttonSubtext + ": " + option.votes}
                                                    letter={letters[index]}
                                                >
                                                    {option.name}
                                                </VoteButton>
                                            ))}
                                            {extraOptionsCount > 0 && (
                                                <p className="text-gray-500 mt-4">
                                                    + {extraOptionsCount} {moreRedacted}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    <footer className="w-full bg-[#404040] text-[#c0c0c0] pt-1.5 text-center text-sm h-8 mt-auto">
                        {parseLabel(footer)}
                    </footer>
                </>
            )}
        </div>
    );
}