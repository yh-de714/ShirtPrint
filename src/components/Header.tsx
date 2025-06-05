import { Palette } from "lucide-react";

const Header = () => {
    return (
        <header className="border-b border-gray-200 py-4 md:px-6 p-x2 bg-white sticky top-0 z-10 w-full">
            <div className="mx-auto flex justify-between items-center px-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-md">
                        <Palette className="text-indigo-600" />
                    </div>
                    <span className="ml-3 text-xl font-medium text-gray-800">CustomizeIt</span>
                </div>

                <div className="md:flex items-center lg:space-x-6 space-x-2 hidden">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">1</div>
                        <span className="ml-2 font-medium text-indigo-600">Design</span>
                    </div>
                    <div className="lg:w-12 w-8 h-0.5 bg-gray-300"></div>
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-medium">2</div>
                        <span className="ml-2 text-gray-500">Buy/Sell</span>
                    </div>
                    <div className="lg:w-12 w-8 h-0.5 bg-gray-300"></div>
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-medium">3</div>
                        <span className="ml-2 text-gray-500">Finish</span>
                    </div>
                </div>

                <button id="next-button" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 sm:px-6 px-4 rounded-md sm:text-md  text-sm font-medium transition duration-200">
                    Next: Buy/Sell
                </button>
            </div>
        </header>
    )
}

export default Header;