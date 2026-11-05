// Bỏ _id, __v và các trường nhạy cảm khi trả JSON ra ngoài
export function cleanJSON(extraHidden = []) {
  return {
    transform(_doc, ret) {
      delete ret._id;
      delete ret.__v;
      extraHidden.forEach((key) => delete ret[key]);
      return ret;
    },
  };
}

// Tên không phân biệt hoa thường: "Khối A" và "khối a" là một
export const NAME_COLLATION = { locale: 'vi', strength: 2 };
