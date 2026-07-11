package com.locanara

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ConversationIdTests {
    @Test
    fun `requested conversation ID takes precedence`() {
        assertEquals(
            "requested-id",
            selectConversationId(requested = "requested-id", generated = "generated-id"),
        )
    }

    @Test
    fun `generated conversation ID is preserved without a request ID`() {
        assertEquals(
            "generated-id",
            selectConversationId(requested = null, generated = "generated-id"),
        )
    }

    @Test
    fun `missing conversation IDs remain absent`() {
        assertNull(selectConversationId(requested = null, generated = null))
    }
}
