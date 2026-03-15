import Contact from './contact.model.js';

export const createContact = async (userId, payload) => {
  return Contact.create({ ...payload, userId });
};

export const getContactById = async (id) => {
  const doc = await Contact.findById(id);
  if (!doc) throw new Error('Contact not found');
  return doc;
};

// simple pagination only (page, limit)
export const listContacts = async ({ page = 1, limit = 10, search } = {}) => {
  const match = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    match.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { message: regex }
    ];
  }

  const total = await Contact.countDocuments(match);
  const items = await Contact.find(match)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    items,
    paginationInfo: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalData: total
    }
  };
};

export const deleteContact = async (id) => {
  const doc = await Contact.findByIdAndDelete(id);
  if (!doc) throw new Error('Contact not found');
  return { success: true };
};

export const updateContact = async (id, payload = {}) => {
  const allowedStatuses = ['read', 'unread'];
  const update = {};

  if (payload.status) {
    if (!allowedStatuses.includes(payload.status)) {
      throw new Error('Invalid status value');
    }
    update.status = payload.status;
  }

  if (!Object.keys(update).length) {
    throw new Error('No updatable fields provided');
  }

  const doc = await Contact.findByIdAndUpdate(id, update, { new: true });
  if (!doc) throw new Error('Contact not found');
  return doc;
};
