<script setup>
import { PhXCircle } from '@phosphor-icons/vue';

defineProps({
  show: Boolean,
  title: String,
  closeable: { type: Boolean, default: true }
});

const emit = defineEmits(['close']);
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeable && emit('close')"></div>
      
      <!-- 弹窗主体 -->
      <div class="relative bg-paper-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-candy-blue overflow-hidden transform transition-all modal-content">
        
        <!-- 标题栏 -->
        <div class="bg-candy-blue p-4 flex justify-between items-center">
          <h3 class="text-2xl font-bold text-white font-cartoon tracking-wider">{{ title }}</h3>
          <button v-if="closeable" @click="emit('close')" class="text-white hover:scale-110 transition">
            <PhXCircle size="32" weight="fill" />
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-fade-leave-active .modal-content {
  animation: zoom-out 0.3s ease;
}

@keyframes bounce-in {
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes zoom-out {
  to { transform: scale(0.9); opacity: 0; }
}
</style>