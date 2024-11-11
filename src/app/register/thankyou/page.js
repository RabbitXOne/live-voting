"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

export default function Register() {
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    const router = useRouter()

    useEffect(() => {
        const formSubmitted = localStorage.getItem('formSubmitted');
        if (!formSubmitted) {
            router.push('/register');
        }
    }, []);

    useEffect(() => {
        fetch("/api/registerthankyou")
            .then((response) => response.json())
            .then((data) => {
                setTitle(data.title)
                setDescription(data.description)
                setLoading(false)
            })
            .catch((error) => {
                console.error("Error fetching data:", error)
            })
    }, [])

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#fdfdfd] relative">
            <div className="flex justify-center items-center mt-10">
                <div className="border border-transparent max-w-[64rem] w-full p-6">
                    <Image
                        className="mx-auto"
                        src="/next.svg"
                        alt="Next.js logo"
                        width={180}
                        height={38}
                        priority
                    />
                    <h2 id="title" className="mt-8 text-gray-900 break-words text-center font-semibold">
                        {title}
                    </h2>

                    <div className="mt-2">
                        {loading && (
                            <>
                                <div className="w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                                <div className="mt-3 w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                                <div className="mt-3 w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                            </>
                        )}
                        {!loading && (
                            <div className="flex flex-col items-center">
                                <p id="description" className="text-gray-700 text-center">
                                    {description}
                                </p>
                                <div className="animation-ctn mt-6">
                                    <div className="icon icon--order-success svg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="154px" height="154px">
                                            <g fill="none" stroke="#22AE73" strokeWidth="2">
                                                <circle cx="77" cy="77" r="72" style={{ strokeDasharray: '480px, 480px', strokeDashoffset: '960px' }}></circle>
                                                <circle id="colored" fill="#22AE73" cx="77" cy="77" r="72" style={{ strokeDasharray: '480px, 480px', strokeDashoffset: '960px' }}></circle>
                                                <polyline className="st0" stroke="#fff" strokeWidth="10" points="43.5,77.8 63.7,97.9 112.2,49.4" style={{ strokeDasharray: '100px, 100px', strokeDashoffset: '200px' }}></polyline>
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}