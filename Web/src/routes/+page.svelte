<script>
    let showCard = false;

    function toggleCard() {
        showCard = !showCard;
    }
</script>

<style>
    .fade-toggle {
        opacity: 1;
        transition: opacity 1s ease-in-out;
    }
</style>

<div class="w-full h-screen absolute invisible md:visible">
    <img src="Img/Waves/Vector.png" class="absolute bottom-0" alt="Wave1"/>
    <img src="Img/Waves/Vector-1.png" class="absolute bottom-0" alt="Wave2"/>
    <img src="Img/Waves/Vector-2.png" class="absolute bottom-0" alt="Wave3"/>
</div>

<div class="absolute w-full h-screen">
    <div class="container mx-auto h-screen flex flex-col md:flex-row gap-5
            md:justify-around justify-evenly items-center content-area {showCard ? 'off-screen' : ''} ">
        <h1 class="text-6xl lg:text-9xl font-extrabold pl-5 fade-toggle {showCard ? 'hidden' : ''}">
            Impossible is
            an
            <span class="text-primary">opinion</span>
        </h1>
        <div class="aspect-square h-1/3 md:h-1/2">
            <!-- Make image size and position relative to scrollY -->
            <img src="MatejMa2ur.png"
                 alt="Personal"
                 class="max-h-full" />
        </div>
        <div class="card fade-toggle {showCard ? '' : 'hidden'}">
            Some
        </div>
    </div>
</div>

<div class="absolute w-full">
    <div class="container mx-auto flex justify-end gap-3 p-3">
        <button class="btn btn-neutral">Projects</button>
        <button class="btn btn-neutral" on:click={toggleCard}>Contact</button>
    </div>
</div>