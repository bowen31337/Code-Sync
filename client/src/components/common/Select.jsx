import PropTypes from "prop-types"
import { IoIosArrowDown } from "react-icons/io"

function Select({ onChange, value, options, title }) {
    return (
        <div className="relative w-full">
            <p className="mb-2">{title}</p>
            <select
                className="w-full rounded-lg border-none bg-white px-4 py-2 text-black outline-none "
                value={value}
                onChange={onChange}
            >
                {Object.entries(options)
                    .sort()
                    .map((option) => {
                        const name = option[0]
                        return (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        )
                    })}
            </select>
            <IoIosArrowDown
                size={14}
                className="absolute bottom-3 right-4 z-10"
                color="black"
            />
        </div>
    )
}

Select.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
}

export default Select