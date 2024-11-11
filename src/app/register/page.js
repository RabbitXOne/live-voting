"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import FileUpload from "@/components/custom/FileUpload"
import { useRouter } from 'next/navigation'

import { ChevronsUpDown, Trash2, Plus, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function Register() {
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [submitBtn, setSubmitBtn] = useState("")
    const [submitDialog, setSubmitDialog] = useState("")
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState([])
    const [dropdownStates, setDropdownStates] = useState({})
    const [validationErrors, setValidationErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [infoUnderSend, setInfoUnderSend] = useState("")
    const [waitForUpload, setWaitForUpload] = useState(false);
    const [waitForUploadText, setWaitForUploadText] = useState("");
    const [optionalText, setOptionalText] = useState("");
    const [tabTitle, setTabTitle] = useState("");
    const [formEnabled, setFormEnabled] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        fetch("/api/getregister")
            .then((response) => response.json())
            .then((data) => {
                setTitle(data.title)
                setSubmitBtn(data.submitButtonName)
                setInfoUnderSend(data.infoUnderSend)
                setWaitForUploadText(data.waitForUploadText)
                setSubmitDialog(data.dialogOnSend)
                setOptionalText(data.optionalText)
                setFormEnabled(data.formEnabled)
                if (!data.formEnabled) { router.push('/') }
                setFormData(data.formdata)
                setTabTitle(data.tabTitle)
                setLoading(false)
            })
            .catch((error) => {
                console.error("Error fetching data:", error)
            })
    }, [])

    useEffect(() => {
        const formSubmitted = localStorage.getItem('formSubmitted');
        if (formSubmitted) {
            localStorage.removeItem('formSubmitted');
            router.push('/register');
        }
    }, []);

    const generateUniqueVoterId = async () => {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const fingerprint = result.visitorId;
      
        let salt = localStorage.getItem('voterSalt');
        if (!salt) {
            salt = crypto.randomUUID();
            localStorage.setItem('voterSalt', salt);
        }
      
        const uniqueVoterId = `${fingerprint}-${salt}`;
        
        localStorage.setItem('voterId', uniqueVoterId);
        return uniqueVoterId;

    };
    
    const handleChange = (index, value) => {
        setFormData((prevFormData) => {
            const newFormData = [...prevFormData];
            newFormData[index].selectedValue = value;
            return newFormData;
        });

        if(!formData[index].required) return;

        setValidationErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            if (value) {
                delete newErrors[index];
            } else {
                newErrors[index] = 'To pole jest wymagane.'
            }
            return newErrors;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault()

        const errors = {}

        formData.forEach((item, index) => {
            if (item.showif) {
                const [showIndex, value] = item.showif.split("=")
                if (formData[showIndex]?.selectedValue !== value) {
                    return
                }
            }

            if (item.required) {
                let value = item.selectedValue

                if (item.type === 'radiogroup' && !value && item.default) {
                    value = item.default
                    setFormData((prevFormData) => {
                        const newFormData = [...prevFormData]
                        newFormData[index].selectedValue = item.default
                        return newFormData
                    });
                }

                if (item.type === 'table') {
                    if (!item.data || item.data.length === 0) {
                        errors[index] = 'To pole jest wymagane.'
                    }
                } else {
                    if (!value || value === '') {
                        errors[index] = 'To pole jest wymagane.'
                    }
                }
            }
        })

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            return
        } else {
            setValidationErrors({})
            if(submitDialog && checkShowIfCondition(submitDialog.showif)) {
                setShowDialog(true);
                return;
            } else {
                submitForm();
            }
        }
    }

    const submitForm = () => {
        setIsSubmitting(true)
        const dataToSend = formData.reduce((acc, item, index) => {
            if (item.showif) {
                const [showIndexStr, value] = item.showif.split("=");
                const showIndex = parseInt(showIndexStr, 10);
                if (isNaN(showIndex) || !formData[showIndex] || formData[showIndex].selectedValue !== value) {
                    return acc;
                }
            }

            const base = {
                type: item.type,
                label: item.label,
                index: index.toString(),
                value: item.type === 'table' ? undefined : (item.selectedValue || null)
            }

            if (item.type === 'table') {
                base.value = item.data ? item.data.map((row, rowIndex) => ({
                    rowIndex: rowIndex.toString(),
                    columns: row.map((col, colIndex) => ({
                        columnIndex: colIndex.toString(),
                        value: col || null
                    }))
                })) : []
            }

            return [...acc, base]
        }, [])

        let fingerprint = generateUniqueVoterId();

        let firestoreDoc = {
            form: dataToSend,
            timestamp: new Date(),
            ip: window.location.hostname,
            userAgent: window.navigator.userAgent,
            fingerprint: fingerprint
        };

        fetch('/api/sendregister', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(firestoreDoc)
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data)
            localStorage.setItem('formSubmitted', 'true');
            router.push('/register/thankyou');
            setIsSubmitting(false)
        })
        .catch((error) => {
            console.error('Error:', error)
            setIsSubmitting(false) 
        })
    }

    const checkShowIfCondition = (showifCondition) => {
        if (!showifCondition || showifCondition === 'true') return true;
        const [showIndexStr, value] = showifCondition.split("=");
        const showIndex = parseInt(showIndexStr, 10);
        if (isNaN(showIndex) || !formData[showIndex]) return false;
        return formData[showIndex].selectedValue === value;
    };

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

    const handleFilesUploaded = (index) => async (files) => {
        setWaitForUpload(true);
        let multiple = false;
        const formData = new FormData();
        if(Array.isArray(files)) {
            multiple = true;
            files.forEach((file) => {
                formData.append('files', file);
            });
        } else if(files) {
            multiple = false;
            formData.append('files', files);
        } else {
            return;
        }

        try {    
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Multiple': multiple
                },
                body: formData
            });
    
            if (response.ok) {
                console.log('Files successfully uploaded');
                setFormData((prevFormData) => {
                    const newFormData = [...prevFormData];
                    newFormData[index].selectedValue = files;
                    return newFormData;
                });
                setWaitForUpload(false);
            } else {
                console.error('Failed to upload files');
                setWaitForUpload(false);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            setWaitForUpload(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#fdfdfd] relative">
            <title>{tabTitle}</title>
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
                    <h2 id="title" className="mt-4 text-gray-900 break-words text-center">
                        {title}
                    </h2>

                    <div className="mt-12">
                        {loading && (
                            <>
                                <div className="w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                                <div className="mt-3 w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                                <div className="mt-3 w-full h-10 bg-gray-300 animate-pulse rounded-md"></div>
                            </>
                        )}
                        {!loading && (
                            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                                {formData.map((item, index) => {
                                    if (item.type === "input") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=")
                                            if (
                                                formData[showIndex]?.selectedValue !== value
                                            ) {
                                                return null
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <Label
                                                    htmlFor={item.name}
                                                    className="font-medium text-start mb-1"
                                                >
                                                    {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                </Label>
                                                <Input
                                                    type="text"
                                                    id={item.name}
                                                    name={item.name}
                                                    placeholder={item.placeholder}
                                                    className={
                                                        validationErrors[index] ? 'border-red-500' : ''
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setFormData((prevFormData) => {
                                                            const newFormData = [...prevFormData]
                                                            newFormData[index].selectedValue = value
                                                            return newFormData
                                                        });
                                                        handleChange(index, value);
                                                    }}
                                                />
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    } else if (item.type === "textarea") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=")
                                            if (
                                                formData[showIndex]?.selectedValue !== value
                                            ) {
                                                return null
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <Label
                                                    htmlFor={item.name}
                                                    className="font-medium text-start mb-1"
                                                >
                                                    {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                </Label>
                                                <Textarea
                                                    type="text"
                                                    id={item.name}
                                                    name={item.name}
                                                    placeholder={item.placeholder}
                                                    className={`max-h-48 ${
                                                        validationErrors[index] ? 'border-red-500' : ''
                                                    }`}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setFormData((prevFormData) => {
                                                            const newFormData = [...prevFormData]
                                                            newFormData[index].selectedValue = value
                                                            return newFormData
                                                        });
                                                        handleChange(index, value);
                                                    }}
                                                />
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    } else if (item.type === "dropdownsearch") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=")
                                            if (
                                                formData[showIndex]?.selectedValue !== value
                                            ) {
                                                return null
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <Label
                                                    htmlFor={item.name}
                                                    className="font-medium text-start mb-1"
                                                >
                                                    {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                </Label>
                                                <Popover
                                                    open={dropdownStates[index]?.open || false}
                                                    onOpenChange={(isOpen) => {
                                                        setDropdownStates((prevState) => ({
                                                            ...prevState,
                                                            [index]: {
                                                                ...prevState[index],
                                                                open: isOpen,
                                                            },
                                                        }))
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={
                                                                dropdownStates[index]?.open || false
                                                            }
                                                            className={`w-full justify-between ${
                                                                validationErrors[index]
                                                                    ? 'border-red-500'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {dropdownStates[index]?.value ||
                                                                item.placeholder}
                                                            <ChevronsUpDown className="opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Wyszukaj..." />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    Nie znaleziono niczego.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {item.options.map(
                                                                        (option, idx) => (
                                                                            <CommandItem
                                                                                key={idx}
                                                                                value={option}
                                                                                onSelect={() => {
                                                                                    setDropdownStates(
                                                                                        (
                                                                                            prevState
                                                                                        ) => ({
                                                                                            ...prevState,
                                                                                            [index]: {
                                                                                                ...prevState[
                                                                                                    index
                                                                                                ],
                                                                                                value: option,
                                                                                                open: false,
                                                                                            },
                                                                                        })
                                                                                    )
                                                                                    setFormData(
                                                                                        (
                                                                                            prevFormData
                                                                                        ) => {
                                                                                            const newFormData = [
                                                                                                ...prevFormData,
                                                                                            ]
                                                                                            newFormData[
                                                                                                index
                                                                                            ].selectedValue = option
                                                                                            return newFormData
                                                                                        }
                                                                                    );
                                                                                    handleChange(index, option);
                                                                                }}
                                                                            >
                                                                                {option}
                                                                            </CommandItem>
                                                                        )
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    } else if (item.type === "dropdown") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=");
                                            if (formData[showIndex]?.selectedValue !== value) {
                                                return null;
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <Label htmlFor={item.name} className="font-medium text-start mb-1">
                                                    {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                </Label>
                                                <Select
                                                    onValueChange={(value) => {
                                                        setFormData((prevFormData) => {
                                                            const newFormData = [...prevFormData];
                                                            newFormData[index].selectedValue = value;
                                                            return newFormData;
                                                        });
                                                        handleChange(index, value);
                                                    }}
                                                >
                                                    <SelectTrigger className={`w-full ${
                                                        validationErrors[index] ? 'border-red-500' : ''
                                                    }`}>
                                                        <SelectValue placeholder={item.placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {item.options.map((option, idx) => (
                                                            <SelectItem key={idx} value={option}>
                                                                {option}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    } else if (item.type === "radiogroup") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=")
                                            if (
                                                formData[showIndex]?.selectedValue !== value
                                            ) {
                                                return null
                                            }
                                        }

                                        return (
                                            <div key={index}>
                                                <Label className="font-medium text-start mb-2">
                                                    {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                </Label>
                                                <RadioGroup
                                                    defaultValue={item.default}
                                                    onValueChange={(value) => {
                                                        setFormData((prevFormData) => {
                                                            const newFormData = [...prevFormData]
                                                            newFormData[index].selectedValue = value
                                                            return newFormData
                                                        });
                                                        handleChange(index, value);
                                                    }}
                                                >

                                                    {item.options.map((option, idx) => {
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <RadioGroupItem
                                                                    value={option}
                                                                    id={`${item.name}-${idx}`}
                                                                />
                                                                <Label
                                                                    htmlFor={`${item.name}-${idx}`}
                                                                >
                                                                    {option}
                                                                </Label>
                                                            </div>
                                                        )
                                                    })}
                                                </RadioGroup>
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    } else if (item.type === "table") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split("=")
                                            if (
                                                formData[showIndex]?.selectedValue !== value
                                            ) {
                                                return null
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <DynamicTable 
                                                    item={item} 
                                                    onDataChange={(data) => {
                                                        setFormData(prevFormData => {
                                                            const newFormData = [...prevFormData];
                                                            newFormData[index].data = data;
                                                            return newFormData;
                                                        });
                                                        handleChange(index, data);
                                                    }}
                                                    hasError={!!validationErrors[index]}
                                                />
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    } else if (item.type === "checkbox") {
                                        if (item.showif) {
                                            const [showIndex, value] = item.showif.split('=')
                                            if (formData[showIndex]?.selectedValue !== value) {
                                                return null
                                            }
                                        }
                                        return (
                                            <div key={index}>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <Checkbox
                                                        id={item.name}
                                                        checked={item.selectedValue || false}
                                                        onCheckedChange={(checked) => {
                                                            setFormData((prevFormData) => {
                                                                const newFormData = [...prevFormData]
                                                                newFormData[index].selectedValue = checked
                                                                return newFormData
                                                            });
                                                            handleChange(index, checked);
                                                        }}
                                                    />
                                                    <Label htmlFor={item.name}>
                                                        {parseLabel(item.label)} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                                    </Label>
                                                </div>
                                                {validationErrors[index] && (
                                                    <p className="text-red-500 mt-1 text-sm">
                                                        {validationErrors[index]}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }
                                else if (item.type === "uploadfile") {
                                    if (item.showif) {
                                        const [showIndex, value] = item.showif.split("=")
                                        if (formData[showIndex]?.selectedValue !== value) {
                                            return null
                                        }
                                    }
                                    return (
                                        <div key={index}>
                                            <Label className="font-medium text-start mb-1">
                                                {item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}
                                            </Label>
                                            <FileUpload
                                                onFilesUploaded={handleFilesUploaded(index)}
                                                uploadMode={item.uploadMode}
                                                defaultText={item.defaultText}
                                                otherText={item.otherText}
                                                invalidText={item.invalidText}
                                                maxSize={item.maxSize}
                                                acceptedFileTypes={item.acceptedFileTypes}
                                            />
                                            {validationErrors[index] && (
                                                <p className="text-red-500 mt-1 text-sm">
                                                    {validationErrors[index]}
                                                </p>
                                            )}
                                        </div>
                                    )
                                }
                                })}
                                <Button type="submit" className="mt-6" disabled={isSubmitting || waitForUpload}>
                                    {isSubmitting && <Loader2 className="animate-spin" />} {submitBtn}
                                </Button>
                                
                                {waitForUploadText && waitForUpload && (
                                    <div className="text-gray-500 text-xs text-center">
                                        {parseLabel(waitForUploadText)}
                                    </div>
                                )}

                                {infoUnderSend && (
                                    <div className="text-gray-500 text-xs text-center">
                                        {parseLabel(infoUnderSend)}
                                    </div>
                                )}


                                {showDialog && submitDialog && (
                                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                                        <DialogContent>
                                            <DialogHeader>
                                            <DialogTitle>{submitDialog.title}</DialogTitle>
                                            <DialogDescription>
                                                {submitDialog.content}
                                            </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                            <Button variant="secondary" onClick={() => setShowDialog(false)}>
                                                {submitDialog.buttonCancel}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowDialog(false);
                                                    submitForm();
                                                }}
                                            >
                                                {submitDialog.buttonContinue}
                                            </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DynamicTable({ item, onDataChange, hasError }) {
    const [data, setData] = useState(() =>
        Array.from({ length: item.min }, () =>
            item.elements.map((el) => (el.type === "input" ? "" : false))
        )
    )
    const [dropdownStates, setDropdownStates] = useState({})

    useEffect(() => {
        onDataChange(data)
    }, [data])

    const handleInputChange = (rowIndex, colIndex, value) => {
        const newData = [...data]
        newData[rowIndex][colIndex] = value
        setData(newData)
    }

    const addRow = () => {
        if (data.length < item.max) {
            setData([
                ...data,
                item.elements.map((el) => (el.type === "input" ? "" : false)),
            ])
        }
    }

    const removeRow = (rowIndex) => {
        if (data.length > item.min) {
            setData(data.filter((_, index) => index !== rowIndex))
        }
    }

    return (
        <>
            <Label className="font-medium text-start mb-2">{item.label} {item.required && <span className="text-red-500">*</span> || !item.required && optionalText && <span className="text-gray-500 text-xs">({optionalText})</span>}</Label>
            <Table className={hasError ? 'border-red-500' : ''}>
                <TableHeader>
                    <TableRow>
                        {item.headers.map((header, index) => (
                            <TableHead key={index}>{header}</TableHead>
                        ))}
                        <TableHead>Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {row.map((cell, colIndex) => (
                                <TableCell key={colIndex}>
                                    {item.elements[colIndex].type === "input" ? (
                                        <Input
                                            placeholder={
                                                item.elements[colIndex].placeholder
                                            }
                                            value={cell}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    rowIndex,
                                                    colIndex,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : item.elements[colIndex].type ===
                                      "checkbox" ? (
                                        <Checkbox
                                            checked={cell}
                                            onCheckedChange={(checked) =>
                                                handleInputChange(
                                                    rowIndex,
                                                    colIndex,
                                                    checked
                                                )
                                            }
                                        />
                                    ) : item.elements[colIndex].type ===
                                      "dropdownsearch" ? (
                                        <Popover
                                            open={
                                                dropdownStates[
                                                    `${rowIndex}-${colIndex}`
                                                ]?.open || false
                                            }
                                            onOpenChange={(isOpen) => {
                                                setDropdownStates((prevState) => ({
                                                    ...prevState,
                                                    [`${rowIndex}-${colIndex}`]: {
                                                        ...prevState[
                                                            `${rowIndex}-${colIndex}`
                                                        ],
                                                        open: isOpen,
                                                    },
                                                }))
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={
                                                        dropdownStates[
                                                            `${rowIndex}-${colIndex}`
                                                        ]?.open || false
                                                    }
                                                    className="w-full justify-between"
                                                >
                                                    {data[rowIndex][colIndex] ||
                                                        item.elements[colIndex]
                                                            .placeholder}
                                                    <ChevronsUpDown className="opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Wyszukaj..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            Nie znaleziono niczego.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {item.elements[
                                                                colIndex
                                                            ].options.map(
                                                                (option, idx) => (
                                                                    <CommandItem
                                                                        key={idx}
                                                                        value={option}
                                                                        onSelect={() => {
                                                                            handleInputChange(
                                                                                rowIndex,
                                                                                colIndex,
                                                                                option
                                                                            )
                                                                            setDropdownStates(
                                                                                (
                                                                                    prevState
                                                                                ) => ({
                                                                                    ...prevState,
                                                                                    [
                                                                                        `${rowIndex}-${colIndex}`
                                                                                    ]: {
                                                                                        ...prevState[
                                                                                            `${rowIndex}-${colIndex}`
                                                                                        ],
                                                                                        open: false,
                                                                                    },
                                                                                })
                                                                            )
                                                                        }}
                                                                    >
                                                                        {option}
                                                                    </CommandItem>
                                                                )
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    ) : item.elements[colIndex].type ===
                                      "dropdown" ? (
                                        <Select
                                            value={cell}
                                            onValueChange={(value) =>
                                                handleInputChange(
                                                    rowIndex,
                                                    colIndex,
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        item.elements[colIndex]
                                                            .placeholder
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {item.elements[colIndex].options.map(
                                                    (option, idx) => (
                                                        <SelectItem
                                                            key={idx}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    ) : null}
                                </TableCell>
                            ))}
                            <TableCell>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => removeRow(rowIndex)}
                                    disabled={data.length <= item.min}
                                >
                                    <Trash2 />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={item.headers.length + 1}>
                            <Button
                                type="button"
                                onClick={addRow}
                                disabled={data.length >= item.max}
                            >
                                <Plus /> {item.addButtonName}
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </>
    )
}
