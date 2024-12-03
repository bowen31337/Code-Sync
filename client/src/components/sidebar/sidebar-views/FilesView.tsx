import FileStructureView from "@/components/files/FileStructureView"
import { useFileSystem } from "@/context/FileContext"
import useResponsive from "@/hooks/useResponsive"
import { FileSystemItem } from "@/types/file"
import cn from "classnames"
import { BiArchiveIn } from "react-icons/bi"
import { TbFileUpload } from "react-icons/tb"
import { v4 as uuidV4 } from "uuid"
import { toast } from "react-hot-toast"
import { useRef } from 'react'

function FilesView() {
    const { downloadFilesAndFolders, updateDirectory } = useFileSystem()
    const { viewHeight } = useResponsive()
    const { minHeightReached } = useResponsive()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFallbackFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        toast.loading("Getting files and folders...")
        const structure: FileSystemItem[] = []
        const directoryMap = new Map<string, FileSystemItem>()

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const pathParts = file.webkitRelativePath.split('/')
            const fileName = pathParts.pop()! // Last part is the file name
            let currentPath = ''

            // Create or get directories in the path
            for (const part of pathParts) {
                const parentPath = currentPath
                currentPath = currentPath ? `${currentPath}/${part}` : part

                if (!directoryMap.has(currentPath)) {
                    const newDir: FileSystemItem = {
                        id: uuidV4(),
                        name: part,
                        type: 'directory',
                        children: [],
                        isOpen: false
                    }
                    directoryMap.set(currentPath, newDir)

                    // Add to parent or root structure
                    if (parentPath) {
                        const parentDir = directoryMap.get(parentPath)
                        parentDir?.children?.push(newDir)
                    } else {
                        structure.push(newDir)
                    }
                }
            }

            // Create and add the file
            const content = await file.text()
            const newFile: FileSystemItem = {
                id: uuidV4(),
                name: fileName,
                type: 'file',
                content
            }

            // Add file to its parent directory or root
            if (pathParts.length > 0) {
                const parentDir = directoryMap.get(currentPath)
                parentDir?.children?.push(newFile)
            } else {
                structure.push(newFile)
            }
        }

        updateDirectory("", structure)
    }

    const handleOpenDirectory = async () => {
        if ("showDirectoryPicker" in window) {
            try {
                const directoryHandle = await window.showDirectoryPicker()
                toast.loading("Getting files and folders...")
                const structure = await readDirectory(directoryHandle)
                updateDirectory("", structure)
            } catch (error) {
                console.error("Error opening directory:", error)
            }
        } else {
            // Fallback to traditional file input
            fileInputRef.current?.click()
        }
    }

    const readDirectory = async (
        directoryHandle: FileSystemDirectoryHandle,
    ): Promise<FileSystemItem[]> => {
        const children: FileSystemItem[] = []
        const blackList = ["node_modules", ".git", ".vscode", ".next"]

        for await (const entry of directoryHandle.values()) {
            if (entry.kind === "file") {
                const file = await entry.getFile()
                const newFile: FileSystemItem = {
                    id: uuidV4(),
                    name: entry.name,
                    type: "file",
                    content: await file.text(),
                }
                children.push(newFile)
            } else if (entry.kind === "directory") {
                if (blackList.includes(entry.name)) continue

                const newDirectory: FileSystemItem = {
                    id: uuidV4(),
                    name: entry.name,
                    type: "directory",
                    children: await readDirectory(entry),
                    isOpen: false,
                }
                children.push(newDirectory)
            }
        }
        return children
    }

    return (
        <div
            className="flex select-none flex-col gap-1 px-4 py-2"
            style={{ height: viewHeight, maxHeight: viewHeight }}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFallbackFileUpload}
                multiple
                webkitdirectory=""
                directory=""
                className="hidden"
            />
            <FileStructureView />
            <div
                className={cn(`flex min-h-fit flex-col justify-end pt-2`, {
                    hidden: minHeightReached,
                })}
            >
                <hr />
                <button
                    className="mt-2 flex w-full justify-start rounded-md p-2 transition-all hover:bg-darkHover"
                    onClick={handleOpenDirectory}
                >
                    <TbFileUpload className="mr-2" size={24} />
                    Open File/Folder
                </button>
                <button
                    className="flex w-full justify-start rounded-md p-2 transition-all hover:bg-darkHover"
                    onClick={downloadFilesAndFolders}
                >
                    <BiArchiveIn className="mr-2" size={22} /> Download Code
                </button>
            </div>
        </div>
    )
}

export default FilesView
