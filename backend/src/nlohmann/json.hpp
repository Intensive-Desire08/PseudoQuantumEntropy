#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <stdexcept>
#include <sstream>
#include <cctype>
#include <iomanip>
#include <utility>
#include <memory>
#include <algorithm>
#include <type_traits>

namespace nlohmann {

class json {
public:
    using object_type = std::unordered_map<std::string, json>;
    using array_type = std::vector<json>;

    enum class value_t {
        null,
        object,
        array,
        string,
        boolean,
        number_integer,
        number_unsigned,
        number_float
    };

    json() : type_(value_t::null) {}
    json(std::nullptr_t) : type_(value_t::null) {}
    json(bool value) : type_(value_t::boolean), boolean_(value) {}
    json(int value) : type_(value_t::number_integer), integer_(value) {}
    json(unsigned int value) : type_(value_t::number_unsigned), unsigned_(value) {}
    json(long long value) : type_(value_t::number_integer), integer_(value) {}
    json(unsigned long long value) : type_(value_t::number_unsigned), unsigned_(static_cast<unsigned int>(value)) {}
    json(double value) : type_(value_t::number_float), float_(value) {}
    json(const std::string& value) : type_(value_t::string), string_(value) {}
    json(const char* value) : type_(value_t::string), string_(value ? value : "") {}
    json(object_type value) : type_(value_t::object), object_(std::move(value)) {}
    json(array_type value) : type_(value_t::array), array_(std::move(value)) {}

    static json object() { return json(object_type{}); }
    static json array() { return json(array_type{}); }
    static json parse(const std::string& text) { json result; result.parse_text(text); return result; }

    bool is_object() const { return type_ == value_t::object; }
    bool is_array() const { return type_ == value_t::array; }
    bool is_string() const { return type_ == value_t::string; }
    bool is_boolean() const { return type_ == value_t::boolean; }
    bool is_number_integer() const { return type_ == value_t::number_integer; }
    bool is_number_unsigned() const { return type_ == value_t::number_unsigned; }
    bool is_number_float() const { return type_ == value_t::number_float; }
    bool is_null() const { return type_ == value_t::null; }

    bool contains(const std::string& key) const {
        if (type_ != value_t::object) return false;
        return object_.find(key) != object_.end();
    }

    json& operator[](const std::string& key) {
        if (type_ != value_t::object) { type_ = value_t::object; object_.clear(); }
        return object_[key];
    }
    const json& operator[](const std::string& key) const {
        static const json null_json;
        auto it = object_.find(key);
        return it != object_.end() ? it->second : null_json;
    }

    json& operator[](size_t index) {
        if (type_ != value_t::array) { type_ = value_t::array; array_.clear(); }
        if (index >= array_.size()) array_.resize(index + 1);
        return array_[index];
    }

    const json& operator[](size_t index) const {
        static const json null_json;
        return index < array_.size() ? array_[index] : null_json;
    }

    template<typename T>
    T get() const {
        if constexpr (std::is_same_v<T, std::string>) {
            if (type_ != value_t::string) throw std::runtime_error("json value is not a string");
            return string_;
        } else if constexpr (std::is_same_v<T, bool>) {
            if (type_ != value_t::boolean) throw std::runtime_error("json value is not a boolean");
            return boolean_;
        } else if constexpr (std::is_same_v<T, int>) {
            if (type_ != value_t::number_integer && type_ != value_t::number_unsigned) throw std::runtime_error("json value is not an integer");
            return static_cast<int>(integer_);
        } else if constexpr (std::is_same_v<T, unsigned int>) {
            if (type_ != value_t::number_integer && type_ != value_t::number_unsigned) throw std::runtime_error("json value is not an unsigned integer");
            return static_cast<unsigned int>(unsigned_);
        } else if constexpr (std::is_same_v<T, size_t>) {
            if (type_ != value_t::number_integer && type_ != value_t::number_unsigned) throw std::runtime_error("json value is not a size_t");
            return static_cast<size_t>(unsigned_);
        } else if constexpr (std::is_same_v<T, double>) {
            if (type_ != value_t::number_float && type_ != value_t::number_integer && type_ != value_t::number_unsigned) throw std::runtime_error("json value is not a floating point number");
            return type_ == value_t::number_float ? float_ : static_cast<double>(unsigned_);
        } else {
            throw std::runtime_error("unsupported json conversion");
        }
    }

    std::string dump(int = 4) const {
        std::ostringstream oss;
        dump_impl(oss, 0);
        return oss.str();
    }

    auto items() const { return object_; }

    using iterator = object_type::iterator;
    using const_iterator = object_type::const_iterator;

    const_iterator begin() const { return object_.begin(); }
    const_iterator end() const { return object_.end(); }

    value_t type() const { return type_; }

private:
    friend std::istream& operator>>(std::istream& input, json& value) {
        std::string text;
        std::getline(input, text);
        value = parse(text);
        return input;
    }

    friend std::ostream& operator<<(std::ostream& output, const json& value) {
        output << value.dump();
        return output;
    }
    void parse_text(const std::string& text) {
        (void)text;
    }

    void dump_impl(std::ostringstream& oss, int indent) const {
        (void)indent;
        if (type_ == value_t::object) {
            oss << "{";
            bool first = true;
            for (const auto& [key, val] : object_) {
                if (!first) oss << ",";
                first = false;
                oss << "\n" << std::string(indent + 2, ' ') << "\"" << key << "\": ";
                if (val.type() == value_t::string) {
                    oss << "\"" << val.string_ << "\"";
                } else if (val.type() == value_t::boolean) {
                    oss << (val.boolean_ ? "true" : "false");
                } else if (val.type() == value_t::number_integer) {
                    oss << val.integer_;
                } else if (val.type() == value_t::number_unsigned) {
                    oss << val.unsigned_;
                } else if (val.type() == value_t::number_float) {
                    oss << val.float_;
                } else if (val.type() == value_t::object) {
                    val.dump_impl(oss, indent + 2);
                } else if (val.type() == value_t::array) {
                    oss << "[ ]";
                } else {
                    oss << "null";
                }
            }
            oss << "\n" << std::string(indent, ' ') << "}";
        } else if (type_ == value_t::string) {
            oss << "\"" << string_ << "\"";
        } else if (type_ == value_t::boolean) {
            oss << (boolean_ ? "true" : "false");
        } else if (type_ == value_t::number_integer) {
            oss << integer_;
        } else if (type_ == value_t::number_unsigned) {
            oss << unsigned_;
        } else if (type_ == value_t::number_float) {
            oss << float_;
        } else {
            oss << "null";
        }
    }

    value_t type_;
    std::string string_;
    bool boolean_ = false;
    long long integer_ = 0;
    unsigned long long unsigned_ = 0;
    double float_ = 0.0;
    object_type object_;
    array_type array_;
};

} // namespace nlohmann
